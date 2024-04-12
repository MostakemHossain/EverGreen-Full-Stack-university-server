import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validate.Request';
import { FacultyController } from './faculty.controller';
import { FacultyValidations } from './faculty.validation';
const router = express.Router();

router.get('/', auth(), FacultyController.getAllFaculty);
router.get('/:facultyId', FacultyController.getSingleFaculty);
router.patch(
  '/:facultyId',
  validateRequest(FacultyValidations.updateFacultyValidationSchema),
  FacultyController.updateFaculty,
);
router.delete('/:facultyId', FacultyController.deleteFaculty);

export const facultyRoutes = router;
