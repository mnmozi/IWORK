const logger = require("winston");
const { validationResult } = require("express-validator");

const dbPool = require("../util/database");

exports.checkIn = async (req, res, next) => {
  try {
    const username = req.username;
    const today = new Date();
    const dayOffResult = await dbPool.query(
      `SELECT day FROM Staff_DaysOff WHERE user = ? AND day = ?`,
      [username, today.getDay() + ""]
    );
    if (dayOffResult[0].length === 1) {
      const error = new Error("This is your day off You can't check In");
      error.username = username;
      throw error;
    }
    //see if the use already checked in
    const todayDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate() +
      "";
    const currentTime =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    const checkedInCheck = await dbPool.query(
      `SELECT * FROM Attendance_Records WHERE date = ?`,
      [todayDate]
    );
    if (checkedInCheck[0].length === 1) {
      const error = new Error("You already checked-In");
      error.username = username;
      throw error;
    }
    const result = await dbPool.query(
      `INSERT INTO Attendance_Records(username,date,check_in) VALUES (?,?,?)`,
      [username, todayDate, currentTime]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error at inserting the DateTime");
      error.username = username;
      throw error;
    }
    const returnObject = {
      message: "Checked-In successfully",
      username: username,
      Date: today,
      URL: req.originalUrl,
    };

    res.status(201).json({ returnObject });
  } catch (err) {
    next(err);
  }
};

exports.checkOut = async (req, res, next) => {
  try {
    const username = req.username;
    const today = new Date();
    const dayOffResult = await dbPool.query(
      `SELECT day FROM Staff_DaysOff WHERE user = ? AND day = ?`,
      [username, today.getDay() + ""]
    );
    if (dayOffResult[0].length === 1) {
      const error = new Error("This is your day off You can't check In");
      error.username = username;
      throw error;
    }
    //see if the use checked in today and didn't check out before
    const todayDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate() +
      "";
    const currentTime =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const checkedInCheck = await dbPool.query(
      `SELECT * FROM Attendance_Records WHERE date = ?`,
      [todayDate]
    );
    if (checkedInCheck[0].length === 0) {
      const error = new Error("You didn't checked-In");
      error.username = username;
      throw error;
    }
    if (checkedInCheck[0][0].check_out !== null) {
      logger.info("%o", checkedInCheck[0][0].check_out);
      const error = new Error("You already checked in and out today");
      error.username = username;
      throw error;
    }

    const result = await dbPool.query(
      `UPDATE Attendance_Records SET check_out = ? WHERE username = ? AND date = ?`,
      [currentTime, username, todayDate]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error at inserting the DateTime");
      error.username = username;
      throw error;
    }
    const returnObject = {
      message: "Checked-out successfully",
      username: username,
      Date: today,
      URL: req.originalUrl,
    };

    res.status(201).json({ returnObject });
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceRecords = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const username = req.username;
    const from = req.body.from;
    const to = req.body.to;
    recordsResult = await dbPool.query(
      `SELECT * FROM Attendance_Records WHERE username = ? AND date BETWEEN ? AND ?`,
      [username, from, to]
    );
    const returnObject = {
      message: "Records",
      username: username,
      Data: recordsResult[0],
      URL: req.originalUrl,
    };
    res.status(201).json({ returnObject });
  } catch (err) {
    next(err);
  }
};

// Apply for requests
//start user end requestDate replacement
exports.applyForRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    logger.info("hello");
    //check if it is a leave request or a business request
    const username = req.username;
    const replacement = req.body.replacement;
    const from = req.body.from;
    const to = req.body.to;
    const duration =
      (new Date(to).getTime() - new Date(from).getTime()) /
      (1000 * 60 * 60 * 24);
    const requestType = req.body.requestType; // 0 is leave request  1 is business request

    var currentStaff_member;
    // if leave request we check the annual leaves available
    if (requestType === "0") {
      logger.info(duration);
      const currentStaffMemberData = await dbPool.query(
        `SELECT annual_leaves,job,department,company FROM Staff_Members WHERE username = ? AND annual_leaves >= ?`,
        [username, duration]
      );
      currentStaff_member = currentStaffMemberData[0][0];
      if (!currentStaff_member) {
        const error = new Error("You consumed all your annual leaves");
        error.username = username;
        throw error;
      }
    }
    if (!currentStaff_member) {
      const currentStaffMemberData = await dbPool.query(
        `SELECT job,department,company FROM Staff_Members WHERE username = ?`,
        [username]
      );
      currentStaff_member = currentStaffMemberData[0][0];
    }
    //select the replacement
    const replacementStaffMemberData = await dbPool.query(
      `SELECT job,department,company FROM Staff_Members WHERE username = ?`,
      [replacement]
    );

    const replacementStaffMember = replacementStaffMemberData[0][0];
    // now we check if the replacement is at the same job
    if (
      !replacementStaffMember ||
      !(
        replacementStaffMember.company === currentStaff_member.company &&
        replacementStaffMember.department === currentStaff_member.department &&
        replacementStaffMember.job === currentStaff_member.job
      )
    ) {
      const error = new Error("The replacement is not in your department");
      error.username = username;
      throw error;
    }

    //check if there is another request that the dates have conflicts between them
    const conflictResult = await dbPool.query(
      `SELECT * FROM Requests WHERE username = ? 
      AND ( (replacement_response IS NULL) OR hr_response = 1 OR  (manager_response = 1 AND hr_response IS NULL) )
      AND ( 
        (? >= \`from\` AND ? <= \`to\`) OR 
        (? >= \`from\` AND ? <= \`to\`) OR 
        (? <= \`from\` AND ? >= \`to\`)  )
      LIMIT 1`,
      [username, from, from, to, to, from, to]
    );
    if (conflictResult[0].length !== 0) {
      const error = new Error(
        "There is a conflict between this request and another request that you submitted before"
      );
      error.username = username;
      throw error;
    }
    const today = new Date();

    const todayDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate() +
      "";

    const requestInsertResult = await dbPool.query(
      `INSERT INTO Requests (\`from\`, \`to\`, username, request_date, replacement) VALUES (?,?,?,?,?);`,
      [from, to, username, todayDate, replacement]
    );
    if (requestInsertResult[0].affectedRows !== 1) {
      const error = new Error("Error while inserting into the Requests table");
      error.username = username;
      throw error;
    }
    const requestId = requestInsertResult[0].insertId;
    if (requestType == "0") {
      var leaveType = req.body.leaveType + "";
      if (
        leaveType !== "sick" ||
        leaveType !== "accidental" ||
        leaveType !== "annual"
      ) {
        leaveType = "annual";
      }
      const leaveRequestInsertResult = await dbPool.query(
        `INSERT INTO Leave_Requests VALUES (?,?) `,
        [requestId, leaveType]
      );
      if (leaveRequestInsertResult[0].affectedRows !== 1) {
        const error = new Error(
          "Error while inserting into the Leave_Requests table"
        );
        error.username = username;
        throw error;
      }
    } else {
      const purpose = req.body.purpose;
      const trip_destination = req.body.trip_destination || null;
      if (!purpose) {
        const error = new Error(
          "You must give a purpose for the business trips"
        );
        error.username = username;
        throw error;
      }
      const businessTripInsertResult = await dbPool.query(
        `INSERT INTO Business_Trips VALUES (?,?,?)`,
        [requestId, purpose, trip_destination]
      );
      if (businessTripInsertResult[0].affectedRows !== 1) {
        const error = new Error(
          "Error while inserting into the Business_Trips table"
        );
        error.username = username;
        throw error;
      }
    }
    const returnObject = {
      message: "request are submited successfully",
      username: username,
      Data: { username: username, from: from },
      URL: req.originalUrl,
    };
    logger.info("%o", returnObject);
    res.status(201).json({ returnObject });
  } catch (err) {
    next(err);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const username = req.username;
    const requestsData = await dbPool.query(
      `SELECT Requests.*, Leave_Requests.\`type\`, NULL AS purpose, NULL AS destination 
    FROM Requests 
      JOIN Leave_Requests ON Requests.id = Leave_Requests.id WHERE Requests.username = ?
    UNION
      SELECT  Requests.*, NULL, Business_Trips.purpose, Business_Trips.trip_destination  
    FROM Requests 
      JOIN Business_Trips ON Requests.id = Business_Trips.id WHERE Requests.username = ?`,
      [username, username]
    );
    logger.info("%o", requestsData[0]);
    const returnObject = {
      message: "Requests",
      username: username,
      Data: { Requests: requestsData[0] },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnObject });
  } catch (err) {
    next(err);
  }
};
exports.deleteRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const username = req.username;
    const requestId = req.body.requestId;
    const deleteResult = await dbPool.query(
      `DELETE FROM Requests WHERE id = ? AND username = ? AND (hr_response IS NULL AND manager_response IS NULL)`,
      [requestId, username]
    );
    if (deleteResult.affectedRows === 2) {
      const returnObject = {
        message: "Request has been deleted",
        username: username,
        Data: { Requests: requestId },
        URL: req.originalUrl,
      };
      logger.info("%o", returnObject);
      res.status(201).json({ returnObject });
    } else {
      const error = new Error(
        "You can only delete one of your requests if neither a manager or an hr have a response to it"
      );
      error.username = username;
    }
  } catch (err) {
    next(err);
  }
};
exports.getAnnouncements = async (req, res, next) => {
  try {
    const username = req.username;
    const today = new Date();

    const todayDate =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate() +
      "";
    const getAnnouncementsResult = await dbPool.query(
      `SELECT * FROM Announcements WHERE date-? <= 20 AND company = ( SELECT company FROM Staff_Members WHERE username = ?)`,
      [todayDate, username]
    );
    const returnObject = {
      message: "Announcements",
      username: username,
      Data: { Announcements: getAnnouncementsResult[0] },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnObject });
  } catch (err) {
    next(err);
  }
};
