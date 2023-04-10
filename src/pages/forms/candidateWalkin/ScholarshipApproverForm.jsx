import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Button,
  Typography,
  Paper,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  styled,
  tableCellClasses,
} from "@mui/material";
import FormPaperWrapper from "../../../components/FormPaperWrapper";
import StudentDetails from "../../../components/StudentDetails";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import axios from "../../../services/Api";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import CustomTextField from "../../../components/Inputs/CustomTextField";
import useAlert from "../../../hooks/useAlert";
import CustomRadioButtons from "../../../components/Inputs/CustomRadioButtons";
import CustomModal from "../../../components/CustomModal";

const useStyles = makeStyles((theme) => ({
  bg: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.headerWhite.main,
    padding: 5,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.headerWhite.main,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const initialValues = { postData: "", approve: "", comments: "" };

const requiredFields = ["approve", "comments"];

function ScholarshipApproverForm() {
  const [values, setValues] = useState(initialValues);
  const [studentData, setStudentData] = useState([]);
  const [noOfYears, setNoOfYears] = useState([]);
  const [feeTemplateSubAmountData, setFeeTemplateSubAmountData] = useState([]);
  const [yearwiseSubAmount, setYearwiseSubAmount] = useState([]);
  const [scholarshipData, setScholarshipData] = useState([]);
  const [showScholarship, setShowScholarship] = useState(false);
  const [total, setTotal] = useState();
  const [showTotal, setShowTotal] = useState(false);
  const [verifiedTotal, setVerifiedTotal] = useState();
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    buttons: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [scholarshipHeadwiseData, setScholarshipHeadwiseData] = useState([]);
  const userId = JSON.parse(localStorage.getItem("AcharyaErpUser")).userId;

  const { studentId, scholarshipId } = useParams();
  const { setAlertMessage, setAlertOpen } = useAlert();
  const navigate = useNavigate();

  const classes = useStyles();

  const checks = {
    comments: [values.comments !== ""],
  };

  const errorMessages = {
    comments: ["This field required"],
  };

  useEffect(() => {
    getStudentData();
    getData();
  }, []);

  useEffect(() => {
    // Calculating total verified amount of all year/sem
    let temp = 0;

    Object.values(values.postData).map((obj) => {
      const val = Object.values(obj).reduce((a, b) => {
        const x = Number(a) > 0 ? Number(a) : 0;
        const y = Number(b) > 0 ? Number(b) : 0;
        return x + y;
      });

      temp += val;
    });
    setVerifiedTotal(temp);
  }, [values.postData]);

  const getStudentData = async () => {
    const stdData = await axios
      .get(`/api/student/Student_DetailsAuid/${studentId}`)
      .then((res) => {
        setStudentData(res.data.data[0]);
        return res.data.data[0];
      })
      .catch((err) => console.error(err));
    console.log(stdData);

    // fetching feeTemplateSubAmount
    const feeTemplateSubAmount = await axios
      .get(
        `/api/finance/FetchFeeTemplateSubAmountDetail/${stdData.fee_template_id}`
      )
      .then((res) => {
        setFeeTemplateSubAmountData(res.data.data);
        return res.data.data;
      })
      .catch((err) => console.error(err));

    // fetching feeTemplateData
    const feetemplateData = await axios
      .get(`/api/finance/FetchAllFeeTemplateDetail/${stdData.fee_template_id}`)
      .then((res) => {
        setTotal(res.data.data[0].fee_year_total_amount);
        return res.data.data[0];
      })
      .catch((err) => console.error(err));

    // for fetching program is yearly or semester
    const programDetails = await axios
      .get(
        `/api/academic/FetchAcademicProgram/${feetemplateData.ac_year_id}/${feetemplateData.program_id}/${feetemplateData.school_id}`
      )
      .then((res) => {
        return res.data.data[0];
      })
      .catch((err) => console.error(err));

    // fetch scholarshipData
    await axios
      .get(`/api/student/fetchScholarship2/${scholarshipId}`)
      .then((res) => {
        setScholarshipData(res.data.data[0]);
      })
      .catch((err) => console.error(err));

    // fetch scholarshipheadwiseData
    const getScholarshipHeadwiseData = await axios
      .get(
        `/api/student/scholarshipHeadWiseAmountDetailsOnScholarshipId/${scholarshipId}`
      )
      .then((res) => {
        setScholarshipHeadwiseData(res.data.data);
        return res.data.data;
      })
      .catch((err) => console.error(err));

    //yearSem : No of year or sem of the particular program
    //yearValue : Maintaining the state of year or semwise values of 'values' usestate
    //showYearSem : Expanding to enter scholarship

    const yearSem = [];
    const yearValue = {};
    const showYearSem = {};

    if (feetemplateData.program_type_name.toLowerCase() === "yearly") {
      for (let i = 1; i <= programDetails.number_of_years; i++) {
        yearSem.push({ key: i, value: "Year " + i });
        yearValue["year" + i] = "";
        showYearSem["year" + i] = false;
      }
    } else if (feetemplateData.program_type_name.toLowerCase() === "semester") {
      for (let i = 1; i <= programDetails.number_of_semester; i++) {
        yearSem.push({ key: i, value: "Sem " + i });
        yearValue["year" + i] = "";
        showYearSem["year" + i] = false;
      }
    }

    //temp : for updating initial values to the values usestate
    //tempSubAmount : updating year/sem amount to validate.
    // (scholarship amount should be less than fee template sub amount)

    const temp = {};
    const tempSubAmount = {};

    feeTemplateSubAmount.forEach((obj) => {
      const yearwiseAmt = {};
      const scholarshipAmt = {};

      yearSem.forEach((obj1) => {
        yearwiseAmt["year" + obj1.key] = obj["year" + obj1.key + "_amt"];

        const getAmt = getScholarshipHeadwiseData.filter(
          (fil) =>
            fil.voucher_head_new_id === obj.voucher_head_new_id &&
            fil.scholarship_year === obj1.key
        );

        scholarshipAmt["year" + obj1.key] =
          getAmt.length > 0 ? getAmt[0]["amount"] : "";
      });

      temp[obj.voucher_head_new_id] = scholarshipAmt;
      tempSubAmount[obj.voucher_head_new_id] = yearwiseAmt;
    });

    setNoOfYears(yearSem);
    setShowScholarship(showYearSem);

    setValues((prev) => ({
      ...prev,
      ["postData"]: temp,
    }));

    setYearwiseSubAmount(tempSubAmount);
  };

  const getData = async () => {};

  const handleScholarship = (name) => {
    setShowScholarship((prev) => ({
      ...prev,
      [name]: showScholarship[name] === true ? false : true,
    }));
  };

  const handleChange = (e) => {
    setValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangeVerifier = (e) => {
    // splitName[0] : voucherHeadId
    // splitName[1] : textField name for example (year1,year2...)

    const splitName = e.target.name.split("-");

    setValues((prev) => ({
      ...prev,
      ["postData"]: {
        ...prev.postData,
        [splitName[0]]: {
          ...prev.postData[splitName[0]],
          [splitName[1]]:
            Number(e.target.value) >
            yearwiseSubAmount[splitName[0]][splitName[1]]
              ? yearwiseSubAmount[splitName[0]][splitName[1]]
              : e.target.value,
        },
      },
    }));
  };

  const requiredFieldsValid = () => {
    for (let i = 0; i < requiredFields.length; i++) {
      const field = requiredFields[i];
      if (Object.keys(checks).includes(field)) {
        const ch = checks[field];
        for (let j = 0; j < ch.length; j++) if (!ch[j]) return false;
      } else if (!values[field]) return false;
    }
    return true;
  };

  const handleCreate = async () => {
    const verify = async () => {
      // fetching and updating scholarship status data based approved status id
      const updateData = await axios
        .get(
          `/api/student/scholarshipapprovalstatus/${scholarshipData.scholarship_approved_status_id}`
        )
        .then((res) => {
          return res.data.data;
        })
        .catch((err) => console.error(err));

      updateData.approval = values.approve;
      updateData.approved_by = userId;
      updateData.comments = values.comments;
      updateData.is_approved = "yes";

      updateData.approved_amount =
        verifiedTotal === 0 ? scholarshipData.verified_amount : verifiedTotal;
      noOfYears.forEach((obj) => {
        updateData["year" + obj.key + "_amount"] =
          scholarshipData["year" + obj.key + "_amount"];
      });

      // creating put api data format
      const scholarshipTemp = {};
      scholarshipTemp["sas"] = updateData;

      const temp = [];
      const postData = [];
      const putData = [];

      //creating update api data format
      Object.keys(values.postData).forEach((obj) => {
        noOfYears.forEach((obj1) => {
          if (Number(values.postData[obj]["year" + obj1.key]) > 0) {
            // Check particular voucherId and year present in the existing data
            const check = scholarshipHeadwiseData.filter(
              (item) =>
                item.voucher_head_new_id === Number(obj) &&
                item.scholarship_year === Number(obj1.key)
            );

            if (check.length > 0) {
              check[0].amount = values.postData[obj]["year" + obj1.key];
              console.log(check[0]);
              putData.push(check[0]);
            } else {
              postData.push({
                active: true,
                amount: values.postData[obj]["year" + obj1.key],
                scholarship_id: scholarshipData.scholarship_id,
                scholarship_year: Number(obj1.key),
                voucher_head_new_id: Number(obj),
              });
            }
          }
        });
      });

      await axios
        .put(
          `/api/student/scholarshipHeadWiseAmountDetails/${scholarshipId}`,
          putData
        )
        .then((res) => {})
        .catch((err) => console.error(err));

      await axios
        .post(`/api/student/scholarshipHeadWiseAmountDetails`, postData)
        .then((res) => {})
        .catch((err) => console.error(err));

      return false;
      await axios
        .put(
          `/api/student/updateScholarshipStatus/${scholarshipData.scholarship_id}`,
          scholarshipTemp
        )
        .then((res) => {
          setAlertMessage({
            severity: "success",
            message: "Scholarship approved successfully",
          });
          setAlertOpen(true);
          navigate("/ScholarshipApproverIndex", { replace: true });
        })
        .catch((err) => {
          console.error(err);
        });
    };

    setModalContent({
      title: "",
      message: "Do you want to submit ?",
      buttons: [
        { name: "Yes", color: "primary", func: verify },
        { name: "No", color: "primary", func: () => {} },
      ],
    });
    setModalOpen(true);
  };

  return (
    <>
      <CustomModal
        open={modalOpen}
        setOpen={setModalOpen}
        title={modalContent.title}
        message={modalContent.message}
        buttons={modalContent.buttons}
      />

      <Box component="form" p={1}>
        <FormPaperWrapper>
          <Grid container rowSpacing={4} columnSpacing={{ xs: 2, md: 4 }}>
            <Grid item xs={12}>
              <StudentDetails id={studentId} />
            </Grid>

            <Grid item xs={12}>
              <Grid container>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" className={classes.bg}>
                    Income Details
                  </Typography>
                </Grid>

                <Grid item xs={12} component={Paper} elevation={3} p={2}>
                  <>
                    <Grid container rowSpacing={1.5} columnSpacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">Occupation</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.occupation}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">Residence</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.residence}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">
                          Permanent Address
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.occupation}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">
                          Parent Contact
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.occupation}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">
                          Fee exemption received in past from Acharya Institutes
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.exemption_received === "true"
                            ? "Yes"
                            : "No"}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">
                          What Kind of Fee Exemption are you availing
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.exemption_type}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">
                          Are you benefited from any other scholarship awarded
                          from an outside body
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.occupation}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">
                          Why do you need Fee Exemption ?
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="textSecondary">
                          {scholarshipData.reason}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" className={classes.table}>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell width="10%">
                        <Typography variant="subtitle2">Particulars</Typography>
                      </StyledTableCell>
                      {noOfYears.map((obj, i) => {
                        return (
                          <StyledTableCell
                            key={i}
                            align={
                              showScholarship["year" + obj.key] === true
                                ? "center"
                                : "right"
                            }
                            colSpan={
                              showScholarship["year" + obj.key] === true
                                ? 2
                                : ""
                            }
                          >
                            <Typography variant="subtitle2">
                              {obj.value}
                            </Typography>

                            {showScholarship["year" + obj.key] === true ? (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleScholarship("year" + obj.key)
                                }
                              >
                                <ArrowLeftIcon sx={{ color: "white" }} />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleScholarship("year" + obj.key)
                                }
                              >
                                <ArrowRightIcon sx={{ color: "white" }} />
                              </IconButton>
                            )}
                          </StyledTableCell>
                        );
                      })}
                      <StyledTableCell
                        align="center"
                        sx={{
                          borderRightStyle: showTotal === true ? "hidden" : "",
                        }}
                      >
                        <Typography variant="subtitle2">Total</Typography>

                        {showTotal === true ? (
                          <IconButton
                            size="small"
                            onClick={() => setShowTotal(!showTotal)}
                          >
                            <ArrowLeftIcon sx={{ color: "white" }} />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => setShowTotal(!showTotal)}
                          >
                            <ArrowRightIcon sx={{ color: "white" }} />
                          </IconButton>
                        )}
                      </StyledTableCell>
                      {showTotal === true ? (
                        <StyledTableCell align="center">
                          <Typography variant="subtitle2">Total</Typography>
                          <Typography variant="subtitle2">
                            Scholarship
                          </Typography>
                        </StyledTableCell>
                      ) : (
                        <></>
                      )}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {feeTemplateSubAmountData.map((obj, i) => {
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <Typography variant="body2">
                              {obj.voucher_head + obj.voucher_head_new_id}
                            </Typography>
                          </TableCell>
                          {noOfYears.map((obj1, j) => {
                            return (
                              <>
                                <TableCell
                                  key={j}
                                  align="right"
                                  sx={{
                                    borderRightStyle:
                                      showScholarship["year" + obj1.key] ===
                                      true
                                        ? "hidden"
                                        : "",
                                  }}
                                >
                                  {obj["year" + obj1.key + "_amt"]}

                                  {/* textField Name : combinaton of voucherHeadId and year column */}
                                  {/* checks and error message : combination of year column and voucherHeadId */}
                                </TableCell>
                                {showScholarship["year" + obj1.key] === true ? (
                                  <TableCell width="10%">
                                    <CustomTextField
                                      name={
                                        obj.voucher_head_new_id +
                                        "-" +
                                        "year" +
                                        obj1.key
                                      }
                                      label=""
                                      value={
                                        values["postData"][
                                          obj.voucher_head_new_id
                                        ]["year" + obj1.key]
                                      }
                                      handleChange={handleChangeVerifier}
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          "& input": {
                                            textAlign: "right",
                                          },
                                        },
                                      }}
                                      checks={
                                        checks[
                                          "year" +
                                            obj1.key +
                                            obj.voucher_head_new_id
                                        ]
                                      }
                                      errors={
                                        errorMessages[
                                          "year" +
                                            obj1.key +
                                            obj.voucher_head_new_id
                                        ]
                                      }
                                    />
                                  </TableCell>
                                ) : (
                                  <></>
                                )}
                              </>
                            );
                          })}
                          <TableCell align="right">
                            <Typography variant="subtitle2" mb={1}>
                              {obj.total_amt}
                            </Typography>
                          </TableCell>
                          {showTotal === true ? (
                            <TableCell align="right">
                              <Typography variant="subtitle2">
                                {Object.values(values.postData).length > 0
                                  ? Object.values(
                                      values.postData[obj.voucher_head_new_id]
                                    ).reduce((a, b) => {
                                      const x = Number(a) > 0 ? Number(a) : 0;
                                      const y = Number(b) > 0 ? Number(b) : 0;
                                      return x + y;
                                    })
                                  : 0}
                              </Typography>
                            </TableCell>
                          ) : (
                            <></>
                          )}
                        </TableRow>
                      );
                    })}
                    {/* total template amount */}
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle2">Total</Typography>
                      </TableCell>
                      {noOfYears.map((obj, i) => {
                        return (
                          <>
                            <TableCell
                              key={i}
                              align="right"
                              sx={{
                                borderRightStyle:
                                  showScholarship["year" + obj.key] === true
                                    ? "hidden"
                                    : "",
                              }}
                            >
                              <Typography variant="subtitle2">
                                {feeTemplateSubAmountData.length > 0 ? (
                                  feeTemplateSubAmountData[0][
                                    "fee_year" + obj.key + "_amt"
                                  ]
                                ) : (
                                  <></>
                                )}
                              </Typography>
                            </TableCell>
                            {showScholarship["year" + obj.key] === true ? (
                              <TableCell width="10%" align="right">
                                <Typography variant="subtitle2">
                                  {Object.values(values["postData"])
                                    .map((obj1) => obj1["year" + obj.key])
                                    .reduce((a, b) => {
                                      const x = Number(a) > 0 ? Number(a) : 0;
                                      const y = Number(b) > 0 ? Number(b) : 0;
                                      return x + y;
                                    })}
                                </Typography>
                              </TableCell>
                            ) : (
                              <></>
                            )}
                          </>
                        );
                      })}

                      <TableCell align="right">
                        <Typography variant="subtitle2">{total}</Typography>
                      </TableCell>
                      {showTotal === true ? (
                        <TableCell align="right">
                          <Typography variant="subtitle2">
                            {verifiedTotal}
                          </Typography>
                        </TableCell>
                      ) : (
                        <></>
                      )}
                    </TableRow>

                    {/* Approve scholarship */}
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle2">
                          Verified Scholarship
                        </Typography>
                      </TableCell>
                      {noOfYears.map((obj, i) => {
                        return (
                          <TableCell
                            key={i}
                            align="right"
                            colSpan={
                              showScholarship["year" + obj.key] === true
                                ? 2
                                : ""
                            }
                          >
                            <Typography variant="subtitle2">
                              {Object.values(values["postData"])
                                .map((obj1) => obj1["year" + obj.key])
                                .reduce((a, b) => {
                                  const x = Number(a) > 0 ? Number(a) : 0;
                                  const y = Number(b) > 0 ? Number(b) : 0;
                                  return x + y;
                                })}
                            </Typography>
                          </TableCell>
                        );
                      })}
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2" align="right">
                          {verifiedTotal}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {/* Verified scholarship  */}
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle2">
                          Verified Scholarship
                        </Typography>
                      </TableCell>
                      {noOfYears.map((obj, i) => {
                        return (
                          <TableCell
                            key={i}
                            align="right"
                            colSpan={
                              showScholarship["year" + obj.key] === true
                                ? 2
                                : ""
                            }
                          >
                            <Typography variant="subtitle2">
                              {scholarshipData["year" + obj.key + "_amount"]
                                ? scholarshipData["year" + obj.key + "_amount"]
                                : 0}
                            </Typography>
                          </TableCell>
                        );
                      })}
                      <TableCell align="right" colSpan={2}>
                        <Typography variant="subtitle2">
                          {scholarshipData.prev_approved_amount}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <Grid container rowSpacing={2} columnSpacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" display="inline">
                    Requested Scholarship :
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      display="inline"
                    >
                      {"   " + scholarshipData.requested_scholarship}
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" display="inline">
                    Pre Approved Scholarship :
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      display="inline"
                    >
                      {"   " + scholarshipData.prev_approved_amount}
                    </Typography>
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomRadioButtons
                name="approve"
                label="Approval"
                value={values.approve}
                items={[
                  {
                    value: "conditional",
                    label: "Conditional",
                  },
                  {
                    value: "unconditional",
                    label: "Unconditional",
                  },
                  {
                    value: "reject",
                    label: "Reject",
                  },
                ]}
                handleChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                name="comments"
                label="Comments"
                value={values.comments}
                handleChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12} align="right">
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={!requiredFieldsValid()}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </FormPaperWrapper>
      </Box>
    </>
  );
}

export default ScholarshipApproverForm;
