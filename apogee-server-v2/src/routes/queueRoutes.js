const express = require("express");
const router = express.Router();
const { getQueueOverview } = require("../services/queueService");

// Returns array of department queue buckets — frontend renders the department queue cards
router.get("/overview", async (req, res, next) => {
  try {
    const overview = await getQueueOverview();
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
