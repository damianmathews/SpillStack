import sql from "@/app/api/utils/sql";

// Track view for an idea
export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Update view count and last viewed timestamp
    const [updatedIdea] = await sql`
      UPDATE ideas 
      SET 
        view_count = COALESCE(view_count, 0) + 1,
        last_viewed_at = NOW()
      WHERE id = ${id}
      RETURNING view_count, last_viewed_at
    `;

    if (!updatedIdea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    return Response.json({
      message: "View tracked successfully",
      view_count: updatedIdea.view_count,
      last_viewed_at: updatedIdea.last_viewed_at,
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    return Response.json({ error: "Failed to track view" }, { status: 500 });
  }
}
