const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
router.use(bodyParser.json());

const Candidate = require("../models/candidates");
const { jwtauthMiddleware } = require("../jwt");
const User = require("../models/user");
const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    return user.role === "admin";
  } catch (error) {
    return false;
  }
};

// POST route to add a candidate
router.post("/", jwtauthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add a candidate" });
    }

    const data = req.body; // Assuming the request body contains the person data
    // create a new User document using the Mongoose model
    const newCandidate = new Candidate(data);

    // save the new user to the database

    const response = await newCandidate.save();
    console.log("data saved");
    res.status(200).json({ response: response });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT method to update records
router.put("/:candidateID", jwtauthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add a candidate" });
    }
    // extract id from token
    const candidateID = req.params.candidateID;
    const updatedCandidate = req.body;

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidate,
      { new: true, runValidators: true }
    );
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    console.log("candidate data updated successfully");
    res.status(200).json({ message: "candidate data updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// DELETE method to delete records
router.delete("/:candidateID", jwtauthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add a candidate" });
    }
    // extract id from token
    const candidateID = req.params.candidateID;

    const response = await Candidate.findByIdAndDelete(candidateID);
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    console.log("candidate data deleted successfully");
    res.status(200).json({ message: "candidate data deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// starting the voting logic
router.post("/vote/:candidateID", jwtauthMiddleware, async (req, res) => {
  try {
    const candidateID = req.params.candidateID;
    const userID = req.user.id;

    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVoted) {
      return res.status(403).json({ error: "User has already voted" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ error: "Admin cannot vote" });
    }
    // update the candidate votes
    candidate.votes.push({ user: userID });
    candidate.votesCount++;
    await candidate.save();

    user.isVoted = true;
    await user.save();

    res.status(200).json({ message: "Vote casted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// vote count
router.get("/votes/count", async (req, res) => {
  try {
    const candidateVotes = await Candidate.find().sort({ votesCount: "desc" });
    const records = candidateVotes.map((candidate) => {
      return {
        name: candidate.name,
        party: candidate.party,
        votesCount: candidate.votesCount,
      };
    });
    res.status(200).json({ records });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get all candidates
router.get("/candidatesList", async (req, res) => {
  try {
    const candidates = await Candidate.find();
    if (!candidates) {
      return res.status(404).json({ error: "Candidates not found" });
    }
    res.status(200).json({ candidates });
    console.log("candidates fetched successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
