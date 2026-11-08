export function validateRoleScope(roleCode:string,provinceId?:string|null,municipalityId?:string|null,departmentId?:string|null){
 if(roleCode==='PROVINCIAL_ADMIN'&&!provinceId)return 'Provincial Administrator requires a province.';
 if(roleCode==='PROVINCIAL_DEPARTMENT_ADMIN'&&(!provinceId||!departmentId))return 'Provincial Department Administrator requires a province and department.';
 if(roleCode==='MUNICIPAL_ADMIN'&&!municipalityId)return 'Municipal Administrator requires a municipality or city.';
 if(roleCode==='MUNICIPAL_DEPARTMENT_ADMIN'&&(!municipalityId||!departmentId))return 'Municipal Department Administrator requires a municipality or city and department.';
 if(roleCode==='DEPARTMENT_STAFF'&&(!departmentId||(!provinceId&&!municipalityId)))return 'Department Staff requires a department and geographic assignment.';
 if(roleCode==='AUDITOR'&&!provinceId&&!municipalityId)return 'Auditor requires a province or city/municipality assignment.';
 return null;
}
