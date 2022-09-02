import { React, useState } from "react";
import { Box, Grid, Button, CircularProgress } from "@mui/material";
import FormLayout from "../../components/FormLayout";
import CustomTextField from "../../components/Inputs/CustomTextField";
import axios from "axios";
import ApiUrl from "../../services/Api";
import CustomAlert from "../../components/CustomAlert";
import { useNavigate } from "react-router-dom";
const initialValues = {
  job_type: "",
  job_short_name: "",
};

function JobtypeCreation() {
  const [data, setData] = useState(initialValues);
  const [formValid, setFormValid] = useState({
    job_type: false,
    job_short_name: false,
  });

  const [alertMessage, setAlertMessage] = useState({
    severity: "error",
    message: "",
  });
  const navigate = useNavigate();
  const [alertOpen, setAlertOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    if (e.target.name === "job_short_name") {
      setData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value.toUpperCase(),
        active: true,
      }));
    } else {
      setData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
        active: true,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(formValid).includes(false)) {
      setAlertMessage({
        severity: "error",
        message: "Please fill all fields",
      });
      setAlertOpen(true);
      console.log("failed");
    } else {
      await axios
        .post(`${ApiUrl}/employee/JobType`, data)
        .then((response) => {
          setAlertMessage({
            severity: "success",
            message: response.data.data,
          });
          navigate("/JobtypeIndex", { replace: true });
        })
        .catch((error) => {
          setAlertMessage({
            severity: "error",
            message: error.response ? error.response.data.message : "Error",
          });
          setAlertOpen(true);
        });
    }
  };
  return (
    <>
      <Box component="form" overflow="hidden" p={1}>
        <CustomAlert
          open={alertOpen}
          setOpen={setAlertOpen}
          severity={alertMessage.severity}
          message={alertMessage.message}
        />

        <FormLayout>
          <Grid
            container
            alignItems="center"
            justifyContent="flex-start"
            rowSpacing={4}
            columnSpacing={{ xs: 2, md: 4 }}
          >
            <>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  name="job_type"
                  label="Job Type"
                  value={data.job_type ?? ""}
                  handleChange={handleChange}
                  fullWidth
                  errors={["This field required", "Enter Only Characters"]}
                  checks={[
                    data.job_type !== "",
                    /^[A-Za-z ]+$/.test(data.job_type),
                  ]}
                  setFormValid={setFormValid}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  name="job_short_name"
                  label="Short Name"
                  value={data.job_short_name ?? ""}
                  handleChange={handleChange}
                  inputProps={{
                    minLength: 3,
                    maxLength: 3,
                  }}
                  fullWidth
                  errors={[
                    "This field required",
                    "Enter characters and its length should be three",
                  ]}
                  checks={[
                    data.job_short_name !== "",
                    /^[A-Za-z ]{3,3}$/.test(data.job_short_name),
                  ]}
                  setFormValid={setFormValid}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Grid
                  container
                  alignItems="center"
                  justifyContent="flex-end"
                  textAlign="right"
                >
                  <Grid item xs={2}>
                    <Button
                      style={{ borderRadius: 7 }}
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      onClick={handleSubmit}
                    >
                      {loading ? (
                        <CircularProgress
                          size={25}
                          color="blue"
                          style={{ margin: "2px 13px" }}
                        />
                      ) : (
                        <strong>Submit</strong>
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </>
          </Grid>
        </FormLayout>
      </Box>
    </>
  );
}
export default JobtypeCreation;
