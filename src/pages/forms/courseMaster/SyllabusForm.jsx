import { useState, useEffect } from "react";
import { Box, Grid, Button, CircularProgress } from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import CustomTextField from "../../../components/Inputs/CustomTextField";
import CustomAutocomplete from "../../../components/Inputs/CustomAutocomplete";
import CustomFileInput from "../../../components/Inputs/CustomFileInput";
import FormWrapper from "../../../components/FormWrapper";
import axios from "../../../services/Api";
import useBreadcrumbs from "../../../hooks/useBreadcrumbs";
import useAlert from "../../../hooks/useAlert";

const initialValues = {
  syllabusName: "",
  acYearId: null,
  programMajor: null,
  syllabusFile: null,
};

const requiredFields = ["syllabusName", "acYearId", "programMajor"];

function SyllabusForm() {
  const [isNew, setIsNew] = useState(true);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [syllabusId, setSyllabusId] = useState(null);
  const [acYearOptions, setAcYearOptions] = useState([]);
  const [programSpeOptions, setProgramSpeOptions] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setAlertMessage, setAlertOpen } = useAlert();
  const setCrumbs = useBreadcrumbs();

  const checks = {
    syllabusName: [values.syllabusName !== ""],
  };

  const errorMessages = {
    syllabusName: ["This field required"],
  };

  useEffect(() => {
    getAcademicYearData();
    getProgramSpecializationData();
    if (pathname.toLowerCase() === "/syllabusform") {
      setIsNew(true);
    } else {
      setIsNew(false);
      getEmptypeData();
    }
  }, [pathname]);

  const getAcademicYearData = async () => {
    await axios
      .get(`/api/academic/academic_year`)
      .then((res) => {
        setAcYearOptions(
          res.data.data.map((obj) => ({
            value: obj.ac_year_id,
            label: obj.ac_year,
          }))
        );
      })
      .catch((err) => console.error(err));
  };

  const getProgramSpecializationData = async () => {
    await axios
      .get(`/api/academic/ProgramSpecilization`)
      .then((res) => {
        setProgramSpeOptions(
          res.data.data.map((obj) => ({
            value: obj.program_specialization_id,
            label: obj.program_specialization_name,
          }))
        );
      })
      .catch((err) => console.error(err));
  };

  const getEmptypeData = async () => {
    await axios(`/api/academic/syllabus/${id}`)
      .then((res) => {
        setValues({
          syllabusName: res.data.data.syllabus_name,
          acYearId: res.data.data.ac_year_id,
          programMajor: res.data.data.program_specialization_id,
        });
        setSyllabusId(res.data.data.syllabus_id);
      })
      .catch((err) => console.error(err));
  };

  const handleChange = (e) => {
    setValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangeAdvance = (name, newValue) => {
    setValues((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleFileDrop = (name, newFile) => {
    if (newFile)
      setValues((prev) => ({
        ...prev,
        [name]: newFile,
      }));
  };
  const handleFileRemove = (name) => {
    setValues((prev) => ({
      ...prev,
      [name]: null,
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
    if (!requiredFieldsValid()) {
      setAlertMessage({
        severity: "error",
        message: "Please fill all required fields",
      });
      setAlertOpen(true);
    } else {
      setLoading(true);

      const dataArray = new FormData();
      dataArray.append("syllabus_name", values.syllabusName);
      dataArray.append("ac_year_id", values.acYearId);
      dataArray.append("program_specialization_id", values.programMajor);
      dataArray.append("active", true);
      dataArray.append("file", values.syllabusFile);

      await axios
        .post(`/api/academic/syllabus`, dataArray)
        .then((res) => {
          setLoading(false);
          if (res.status === 200 || res.status === 201) {
            navigate("/SyllabusIndex", { replace: true });
            setAlertMessage({
              severity: "success",
              message: "Syllabus created",
            });
          } else {
            setAlertMessage({
              severity: "error",
              message: res.data ? res.data.message : "An error occured",
            });
          }
          setAlertOpen(true);
        })
        .catch((err) => {
          setLoading(false);
          setAlertMessage({
            severity: "error",
            message: err.response
              ? err.response.data.message
              : "An error occured",
          });
          setAlertOpen(true);
        });
    }
  };

  const handleUpdate = async () => {
    if (!requiredFieldsValid()) {
      setAlertMessage({
        severity: "error",
        message: "Please fill all required fields",
      });
      setAlertOpen(true);
    } else {
      setLoading(true);
      const temp = {};
      temp.active = true;
      temp.syllabus_id = syllabusId;
      temp.syllabus_name = values.syllabusName;
      temp.ac_year_id = values.acYearId;
      temp.program_specialization_id = values.programMajor;

      await axios
        .put(`/api/academic/syllabus/${id}`, temp)
        .then((res) => {
          setLoading(false);
          if (res.status === 200 || res.status === 201) {
            navigate("/SyllabusIndex", { replace: true });
            setAlertMessage({
              severity: "success",
              message: "Syllabus updated",
            });
          } else {
            setAlertMessage({
              severity: "error",
              message: res.data ? res.data.message : "An error occured",
            });
          }
          setAlertOpen(true);
        })
        .catch((err) => {
          setLoading(false);
          setAlertMessage({
            severity: "error",
            message: err.response
              ? err.response.data.message
              : "An error occured",
          });
          setAlertOpen(true);
        });
    }
  };

  return (
    <Box component="form" overflow="hidden" p={1}>
      <FormWrapper>
        <Grid
          container
          alignItems="center"
          justifyContent="flex-start"
          rowSpacing={3}
          columnSpacing={{ xs: 2, md: 4 }}
        >
          <Grid item xs={12} md={4}>
            <CustomTextField
              name="syllabusName"
              label="Name"
              value={values.syllabusName}
              handleChange={handleChange}
              checks={checks.syllabusName}
              errors={errorMessages.syllabusName}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomAutocomplete
              name="acYearId"
              label="Academic Year"
              value={values.acYearId}
              options={acYearOptions}
              handleChangeAdvance={handleChangeAdvance}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomAutocomplete
              name="programMajor"
              label="Program Major"
              value={values.programMajor}
              options={programSpeOptions}
              handleChangeAdvance={handleChangeAdvance}
              required
            />
          </Grid>
          {isNew ? (
            <Grid item xs={12} md={3}>
              <CustomFileInput
                name="syllabusFile"
                label="Resume"
                helperText="PDF - smaller than 2 MB"
                file={values.syllabusFile}
                handleFileDrop={handleFileDrop}
                handleFileRemove={handleFileRemove}
                checks={checks.syllabusFile}
                errors={errorMessages.syllabusFile}
              />{" "}
            </Grid>
          ) : (
            <></>
          )}

          <Grid item xs={12} textAlign="right">
            <Button
              style={{ borderRadius: 7 }}
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={isNew ? handleCreate : handleUpdate}
            >
              {loading ? (
                <CircularProgress
                  size={25}
                  color="blue"
                  style={{ margin: "2px 13px" }}
                />
              ) : (
                <strong>{isNew ? "Create" : "Update"}</strong>
              )}
            </Button>
          </Grid>
        </Grid>
      </FormWrapper>
    </Box>
  );
}

export default SyllabusForm;
