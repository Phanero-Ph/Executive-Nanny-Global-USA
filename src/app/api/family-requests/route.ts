import {NextResponse} from "next/server";
export async function POST() {
 return NextResponse.json({error:"Please use Find a Nanny to create your family account, or submit a nanny or caregiver request from your family dashboard."},{status:410});
}
