/* Only the service of the public API of the employees module is exported
    and other modules, such as (auth, attendance, leave) and middleware import from this file,
    "app.js" imports employee.routes.js directly
*/

export { employeeService } from "./employee.service.js";
