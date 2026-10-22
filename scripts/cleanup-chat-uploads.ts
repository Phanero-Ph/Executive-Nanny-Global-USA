import "dotenv/config";
import {cleanupChatUploads} from "../src/lib/chat-files";
import {pool} from "../src/db";
async function main(){console.log("Expired unused chat uploads removed:",await cleanupChatUploads(1000));}
main().catch(()=>{console.error("Unable to clean up unused chat uploads. Check database and private storage access.");process.exitCode=1;}).finally(()=>pool.end());
