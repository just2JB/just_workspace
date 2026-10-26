export function missionIdFromHash(hash:string):string|null{
  if(!hash.startsWith('#/missions/'))return null;
  try{return decodeURIComponent(hash.slice('#/missions/'.length))||null;}catch{return null;}
}
