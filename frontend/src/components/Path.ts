const app_name = 'cop4331summer2025.xyz';
 export function buildPath(route :string) : string
 {
 if (process.env.NODE_ENV != 'development')
 {
 return 'http://' + app_name + ':5001/' + route;
 }
 else
 {
 return 'http://localhost:5001/' + route;
 }
 }