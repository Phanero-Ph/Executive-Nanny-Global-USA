import {requireAdmin} from "@/lib/admin-access";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {BOOKING_LABELS} from "@/lib/bookings";
import {BookingPanel} from "@/components/BookingPanel";
export const dynamic="force-dynamic";
export const metadata={title:"Care bookings",robots:{index:false,follow:false}};
export default async function AdminBookings({searchParams}:{searchParams:Promise<{status?:string}>}){const user=await getCurrentUser();if(!user)redirect("/login");if(user.role!=="admin")redirect(`/dashboard/${user.role}`);await requireAdmin("matching.view");const params=await searchParams,status=params.status&&Object.hasOwn(BOOKING_LABELS,params.status)?params.status:undefined;
 return <section className="application-page bg-cream-50 px-5 py-12 sm:px-8"><div className="mx-auto max-w-7xl"><Link href="/dashboard/admin" className="text-sm text-ink-900">← Back to administration</Link><h1 className="mt-5 text-3xl text-ink-900">Care bookings</h1><form className="my-7 flex flex-wrap items-end gap-3"><label><span className="application-label">Booking status</span><select name="status" defaultValue={status??""} className="application-input"><option value="">All bookings</option>{Object.entries(BOOKING_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="application-submit">Filter bookings</button></form><BookingPanel role="admin" userId={user.id} statusFilter={status}/></div></section>;
}
