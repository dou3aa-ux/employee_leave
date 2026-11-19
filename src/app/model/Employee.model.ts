import { EmployeeService } from './../services/employee';
export class LoginModel {
    emailId: string;
    password:string;

    constructor(){
        this.emailId='';
        this.password='';
    }

}
export interface APIReponseModel{
    message: string;
    result:boolean;
    data: any;
}

export interface EmployeeList{
    "employeeId": number;
    "employeeName": string;
    "deptId": number;
    "deptName": string;
    "contactNo": string;
    "emailId": string;
    "role": string;
}