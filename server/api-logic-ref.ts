
/**
 * Reference code for implementing the Next.js API Route Handlers.
 * These illustrate how to handle the specific constraints requested.
 */

/* 
// POST /api/reservations
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId } = await req.json();

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get Slot
      const slot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!slot) throw new Error("Slot not found");

      // 2. Check if Slot already reserved (Unique index will catch this, but better check)
      const existing = await tx.reservation.findUnique({ where: { slotId } });
      if (existing) throw new Error("Slot already taken");

      // 3. Check if company already has booking that day (Unique index will catch this)
      const companyDaily = await tx.reservation.findUnique({
        where: { company_date: { company: session.user.company, date: slot.date } }
      });
      if (companyDaily) throw new Error("Already booked for this day");

      // 4. Create
      const res = await tx.reservation.create({
        data: {
          slotId,
          userId: session.user.id,
          company: session.user.company,
          date: slot.date
        }
      });
      return NextResponse.json(res);
    });
  } catch (e: any) {
    // Catch P2002 (Unique constraint failed)
    if (e.code === 'P2002') return NextResponse.json({ error: "Conflict" }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
*/
