// Copyright (c) 2022, TU Wien
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import * as React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  DialogContentText,
  IconButton,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Card,
  CardActionArea,
  Box,
  InputAdornment,
  TooltipProps,
  tooltipClasses,
  Typography,
  Snackbar
} from '@mui/material';
import { Assignment } from '../../model/assignment';
import { LoadingButton } from '@mui/lab';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import { createAssignment } from '../../services/assignments.service';
import { Lecture } from '../../model/lecture';
import TypeEnum = Assignment.TypeEnum;
import AutomaticGradingEnum = Assignment.AutomaticGradingEnum;
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import { Simulate } from 'react-dom/test-utils';
import error = Simulate.error;
import { enqueueSnackbar } from 'notistack';
import { showDialog } from './dialog-provider';
import styled from '@mui/system/styled';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const gradingBehaviourHelp = `Specifies the behaviour when a students submits an assignment.\n
No Automatic Grading: No action is taken on submit.\n
Automatic Grading: The assignment is being autograded as soon as the students makes a submission.\n
Fully Automatic Grading: The assignment is autograded and feedback is generated as soon as the student makes a submission. 
(requires all scores to be based on autograde results)`;

const validationSchema = yup.object({
  name: yup
    .string()
    .min(4, 'Name should be 4-50 character length')
    .max(50, 'Name should be 4-50 character length')
    .required('Name is required'),
  due_date: yup
    .date()
    .min(new Date(), 'Deadline must be set in the future')
    .nullable(),
  type: yup.mixed().oneOf(['user', 'group']),
  automatic_grading: yup.mixed().oneOf(['unassisted', 'auto', 'full_auto']),
  max_submissions: yup
    .number()
    .nullable()
    .min(1, 'Students must be able to at least submit once')
});

const validationSchemaLecture = yup.object({
  name: yup
    .string()
    .min(4, 'Name should be 4-50 characters long')
    .max(50, 'Name should be 4-50 characters long')
    .required('Name is required'),
  complete: yup.boolean()
});

export interface IEditLectureProps {
  lecture: Lecture;
  handleSubmit: (updatedLecture: Lecture) => void;
}

const EditLectureNameTooltip = styled(
  ({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  )
)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 220
  }
}));

export const EditLectureDialog = (props: IEditLectureProps) => {
  const formik = useFormik({
    initialValues: {
      name: props.lecture.name,
      complete: props.lecture.complete
    },
    validationSchema: validationSchemaLecture,
    onSubmit: values => {
      const updatedLecture: Lecture = Object.assign(props.lecture, values);
      props.handleSubmit(updatedLecture);
      setOpen(false);
    }
  });

  const [openDialog, setOpen] = React.useState(false);

  return (
    <div>
      <EditLectureNameTooltip
        title={
          props.lecture.code === props.lecture.name ? (
            <React.Fragment>
              <Typography color="inherit">Edit Lecture</Typography>
              {'Note: '}{' '}
              <em>
                {
                  'Lecture name is currently the same as lecture code. You should edit it to make it more readable.'
                }
              </em>
            </React.Fragment>
          ) : (
            'Edit Lecture'
          )
        }
      >
        <IconButton
          onClick={e => {
            e.stopPropagation();
            setOpen(true);
          }}
          onMouseDown={event => event.stopPropagation()}
          aria-label="edit"
        >
          <SettingsIcon />
        </IconButton>
      </EditLectureNameTooltip>
      <Dialog open={openDialog} onBackdropClick={() => setOpen(false)}>
        <DialogTitle>Edit Lecture</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                variant="outlined"
                fullWidth
                id="name"
                name="name"
                label="Lecture Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    value={formik.values.complete}
                    checked={formik.values.complete}
                    onChange={e => {
                      formik.setFieldValue('complete', e.target.checked);
                    }}
                  />
                }
                label="Complete"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              color="primary"
              variant="outlined"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button color="primary" variant="contained" type="submit">
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

interface INewAssignmentCardProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export default function NewAssignmentCard(props: INewAssignmentCardProps) {
  return (
    <Card
      sx={{ width: 225, height: '100%', m: 1.5, backgroundColor: '#fcfcfc' }}
    >
      <Tooltip title={'New Assignment'}>
        <CardActionArea
          onClick={props.onClick}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <AddIcon sx={{ fontSize: 50 }} color="disabled" />
        </CardActionArea>
      </Tooltip>
    </Card>
  );
}

interface ICreateDialogProps {
  lecture: Lecture;
  handleSubmit: (assigment: Assignment) => void;
}

export const CreateDialog = (props: ICreateDialogProps) => {
  const formik = useFormik({
    initialValues: {
      name: 'Assignment',
      due_date: null,
      type: 'user',
      automatic_grading: 'auto' as AutomaticGradingEnum,
      max_submissions: undefined as number,
      allow_files: false
    },
    validationSchema: validationSchema,
    onSubmit: values => {
      if (
        values.max_submissions !== null &&
        values.max_submissions !== undefined
      ) {
        values.max_submissions = +values.max_submissions;
      }
      const newAssignment: Assignment = {
        name: values.name,
        due_date: values.due_date,
        type: values.type as TypeEnum,
        automatic_grading: values.automatic_grading as AutomaticGradingEnum,
        max_submissions: values.max_submissions,
        allow_files: values.allow_files
      };
      createAssignment(props.lecture.id, newAssignment).then(
        a => {
          props.handleSubmit(a);
        },

        error => {
          enqueueSnackbar(error.message, {
            variant: 'error'
          });
        }
      );
      setOpen(false);
    }
  });

  const [openDialog, setOpen] = React.useState(false);

  const [openSnackbar, setOpenSnackBar] = React.useState(false);

  const handleOpenSnackBar = () => {
    setOpenSnackBar(true);
  };

  const handleCloseSnackBar = () => {
    setOpenSnackBar(false);
  };

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  return (
    <>
      <Tooltip title={'Create New Assignment'}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={e => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          New
        </Button>
      </Tooltip>
      <Dialog
        open={openDialog}
        onBackdropClick={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>Create Assignment</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                variant="outlined"
                fullWidth
                id="name"
                name="name"
                label="Assignment Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <FormControlLabel
                  control={
                    <Checkbox
                      value={false}
                      onChange={async e => {
                        if (e.target.checked) {
                          await formik.setFieldValue('due_date', new Date());
                        } else {
                          await formik.setFieldValue('due_date', null);
                        }
                      }}
                    />
                  }
                  label="Set Deadline"
                />

                <DateTimePicker
                  ampm={false}
                  disabled={formik.values.due_date === null}
                  label="DateTimePicker"
                  value={formik.values?.due_date}
                  onChange={date => {
                    formik.setFieldValue('due_date', date);
                    if (new Date(date).getTime() < Date.now()) {
                      handleOpenSnackBar();
                    }
                  }}
                />
                <Snackbar
                  open={openSnackbar}
                  autoHideDuration={6000}
                  onClose={handleCloseSnackBar}
                >
                  <Alert
                    onClose={handleCloseSnackBar}
                    severity="warning"
                    sx={{ width: '100%' }}
                  >
                    You chose date in the past!
                  </Alert>
                </Snackbar>
              </LocalizationProvider>

              <FormControlLabel
                control={
                  <Checkbox
                    value={Boolean(formik.values.max_submissions)}
                    onChange={async e => {
                      if (e.target.checked) {
                        await formik.setFieldValue('max_submissions', 1);
                      } else {
                        await formik.setFieldValue(
                          'max_submissions',
                          undefined
                        );
                      }
                    }}
                  />
                }
                label="Limit Number of Submissions"
              />

              <TextField
                variant="outlined"
                fullWidth
                disabled={!formik.values.max_submissions}
                type={'number'}
                id="max-submissions"
                name="max_submissions"
                placeholder="Submissions"
                value={formik.values.max_submissions}
                onChange={e => {
                  formik.setFieldValue('max_submissions', e.target.value);
                }}
                error={formik.values.max_submissions < 1}
              />

              <InputLabel id="demo-simple-select-label-auto">
                Auto-Grading Behaviour
                <Tooltip title={gradingBehaviourHelp}>
                  <HelpOutlineOutlinedIcon
                    fontSize={'small'}
                    sx={{ ml: 1.5, mt: 1.0 }}
                  />
                </Tooltip>
              </InputLabel>
              <TextField
                select
                id="assignment-type-select"
                value={formik.values.automatic_grading}
                label="Auto-Grading Behaviour"
                placeholder="Grading"
                onChange={e => {
                  formik.setFieldValue('automatic_grading', e.target.value);
                }}
              >
                <MenuItem value={'unassisted'}>No Automatic Grading</MenuItem>
                <MenuItem value={'auto'}>Automatic Grading</MenuItem>
                <MenuItem value={'full_auto'}>Fully Automatic Grading</MenuItem>
              </TextField>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.allow_files}
                    onChange={async e => {
                      console.log(e.target.checked);
                      await formik.setFieldValue(
                        'allow_files',
                        e.target.checked
                      );
                    }}
                  />
                }
                label="Allow file upload by students"
              />

              {/* Not included in release 1.0
                <InputLabel id="demo-simple-select-label">Type</InputLabel>
                <Select
                labelId="assignment-type-select-label"
                id="assignment-type-select"
                value={formik.values.type}
                label="Type"
                onChange={e => {
                formik.setFieldValue('type', e.target.value);
              }}
                >
                <MenuItem value={'user'}>User</MenuItem>
                <MenuItem value={'group'}>Group</MenuItem>
                </Select>
              */}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              color="primary"
              variant="outlined"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button color="primary" variant="contained" type="submit">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export interface ICommitDialogProps {
  handleCommit: (msg: string) => void;
  children: React.ReactNode;
}

export const CommitDialog = (props: ICommitDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');

  return (
    <div>
      <Box onClick={() => setOpen(true)}>{props.children}</Box>
      <Dialog
        open={open}
        onBackdropClick={() => setOpen(false)}
        onClose={() => setOpen(false)}
        fullWidth={true}
        maxWidth={'sm'}
      >
        <DialogTitle>Commit Files</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ mt: 2, width: '100%' }}
            id="outlined-textarea"
            label="Commit Message"
            placeholder="Commit Message"
            value={message}
            onChange={event => setMessage(event.target.value)}
            multiline
          />
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>

          <Button
            color="primary"
            variant="contained"
            type="submit"
            disabled={message === ''}
            onClick={() => {
              props.handleCommit(message);
              setOpen(false);
            }}
          >
            Commit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export interface IReleaseDialogProps extends ICommitDialogProps {
  assignment: Assignment;
  handleRelease: () => void;
}

export const ReleaseDialog = (props: IReleaseDialogProps) => {
  const [commitOpen, setCommitOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const agreeMessage = `Do you want to release "${props.assignment.name}" for all students? Before releasing, all changes are pushed again as the release version.`;

  return (
    <div>
      <Box
        onClick={() => {
          showDialog('Release Assignment', agreeMessage, () => {
            setCommitOpen(true);
          });
        }}
      >
        {props.children}
      </Box>
      <Dialog
        open={commitOpen}
        onClose={() => setCommitOpen(false)}
        fullWidth={true}
        maxWidth={'sm'}
      >
        <DialogTitle>Commit Files</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ mt: 2, width: '100%' }}
            id="outlined-textarea"
            label="Commit Message"
            placeholder="Commit Message"
            value={message}
            onChange={event => setMessage(event.target.value)}
            multiline
          />
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            onClick={() => {
              setCommitOpen(false);
            }}
          >
            Cancel
          </Button>

          <LoadingButton
            loading={loading}
            color="primary"
            variant="contained"
            type="submit"
            disabled={message === ''}
            onClick={async () => {
              setLoading(true);
              await props.handleCommit(message);
              await props.handleRelease();
              setLoading(false);
              setCommitOpen(false);
            }}
          >
            <span>Commit and Release</span>
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
};
