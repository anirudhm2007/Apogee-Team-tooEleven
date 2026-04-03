const express = require("express");
const router = express.Router();
const Department = require("../models/Department");


router.get("/", async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ code: 1 });
    res.json(departments);
  } catch (err) {
    next(err);
  }
});


router.get("/:code", async (req, res, next) => {
  try {
    const dept = await Department.findOne({ code: req.params.code.toUpperCase() });
    if (!dept) return res.status(404).json({ message: "Department not found" });
    res.json(dept);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
