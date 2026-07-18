import { BaseEntity } from "./common.types";

export interface Attendance extends BaseEntity{
    studentId:string;
    courseId:string;
    date:string;
    status:'present'|'absent'| 'late';
    remarks?:string;

}

export interface AttendanceStats{
    totalClasses:number;
    present:number;
    absent:number;
    late:number;
    attendancePercentage:number;
}