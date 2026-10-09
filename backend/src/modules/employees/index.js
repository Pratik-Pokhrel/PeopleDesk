// Single point/file handling all the features(or routes) related to the "employee" module
// so other modules import from this file only, not other files

export { employeeService } from "./employee.service.js";
export { default as employeeRoutes } from "./employee.routes.js";
