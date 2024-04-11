import httpStatus from 'http-status';
import AppError from '../../utils/AppError';
import { AcademicFaculty } from '../AcademicFaculty/academicFaculty.model';
import { AcademicDepartment } from '../AcademinDepartment/academicDepartment.model';
import { Faculty } from '../Faculty/faculty.model';
import { SemesterRegistration } from '../SemesterRegistration/semesterRegistration.model';
import { Course } from '../course/course.model';
import { TOfferedCourse } from './offeredCourse.interface';
import { OfferedCourse } from './offeredCourse.model';
import { hasTimeConflict } from './offeredCourse.utils';
import QueryBuilder from '../../query/QueryBuilder';

const createOfferedCourseIntoDB = async (payload: TOfferedCourse) => {
  const {
    academicFaculty,
    academicDepartment,
    semesterRegistration,
    course,
    section,
    faculty,
    days,
    startTime,
    endTime,
  } = payload;
  //check if the semester registration id is exists
  const isSemesterRegistrationExists = await SemesterRegistration.findById(
    payload.semesterRegistration,
  );
  if (!isSemesterRegistrationExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Academic Semester is not Found');
  }
  // check if the academic Faculty is Exists
  const isAcademicFacultyExists = await AcademicFaculty.findById(
    payload.academicFaculty,
  );
  if (!isAcademicFacultyExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Academic Faculty is not Found');
  }
  // check if the  Faculty is Exists
  const isFacultyExists = await Faculty.findById(payload.faculty);
  if (!isFacultyExists) {
    throw new AppError(httpStatus.NOT_FOUND, ' Faculty is not Found');
  }
  // check if the  course is Exists
  const isCourseExists = await Course.findById(payload.course);
  if (!isCourseExists) {
    throw new AppError(httpStatus.NOT_FOUND, ' Course is not Found');
  }
  // check if the  Department is Exists
  const isDepartmentExists = await AcademicDepartment.findById(
    payload.academicDepartment,
  );
  if (!isDepartmentExists) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ' Academic Department is not Found',
    );
  }

  // check if the depertment belongs to the faculty
  const isDepartmentbelongToFaculty = await AcademicDepartment.findOne({
    academicFaculty,
    _id: academicDepartment,
  });

  if (!isDepartmentbelongToFaculty) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `this ${isDepartmentExists.name} is not belong to ${isAcademicFacultyExists.name}`,
    );
  }

  // if the same course same section already exists
  const isSameOfferedCourseExistsWithSameRegistrationSemesterWithSameSection =
    await OfferedCourse.findOne({
      semesterRegistration,
      course,
      section,
    });
  if (isSameOfferedCourseExistsWithSameRegistrationSemesterWithSameSection) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Offered course is same section is already exists`,
    );
  }

  // get the schedules of offered course
  const assignSchedules = await OfferedCourse.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  }).select('days startTime endTime');
  const newSchedules = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignSchedules, newSchedules)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This faculty is not available at this time`,
    );
  }

  const academicSemester = isSemesterRegistrationExists.academicSemester;

  const result = await OfferedCourse.create({ ...payload, academicSemester });
  return result;
};

const getAllOfferedCoursesFromDB = async (query: Record<string, unknown>) => {
    const offeredCourseQuery = new QueryBuilder(OfferedCourse.find(), query)
      .filter()
      .sort()
      .paginate()
      .fields();
  
    const result = await offeredCourseQuery.modelQuery;
    return result;
  };
  
  const getSingleOfferedCourseFromDB = async (id: string) => {
    const offeredCourse = await OfferedCourse.findById(id);
  
    if (!offeredCourse) {
      throw new AppError(404, 'Offered Course not found');
    }
  
    return offeredCourse;
  };

const updateCourseFromDB = async (
  id: string,
  payload: Pick<
    TOfferedCourse,
    'faculty' | 'days' | 'startTime' | 'endTime' | 'maxCapacity'
  >,
) => {
  const { faculty, days, startTime, endTime } = payload;
  const isOfferedCourseExists = await OfferedCourse.findById(id);
  if (!isOfferedCourseExists) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'This offered course is not found',
    );
  }

  // check if the  Faculty is Exists
  const isFacultyExists = await Faculty.findById(faculty);
  if (!isFacultyExists) {
    throw new AppError(httpStatus.NOT_FOUND, ' Faculty is not Found');
  }

  const semesterRegistration = isOfferedCourseExists.semesterRegistration;

  const SemesterRegistrationStatus =
    await SemesterRegistration.findById(semesterRegistration);
  if (SemesterRegistrationStatus?.status !== 'UPCOMING') {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot update this offered course');
  }
  // get the schedules of offered course
  const assignSchedules = await OfferedCourse.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  }).select('days startTime endTime');
  const newSchedules = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignSchedules, newSchedules)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This faculty is not available at this time`,
    );
  }
  const result = await OfferedCourse.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

export const OfferedCourseService = {
  createOfferedCourseIntoDB,
  updateCourseFromDB,
  getAllOfferedCoursesFromDB,
  getSingleOfferedCourseFromDB
};
