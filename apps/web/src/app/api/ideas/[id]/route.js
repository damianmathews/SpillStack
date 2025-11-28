import sql from "@/app/api/utils/sql";

// Get individual idea
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const [idea] = await sql`
      SELECT * FROM ideas WHERE id = ${id}
    `;

    if (!idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    return Response.json(idea);
  } catch (error) {
    console.error("Error fetching idea:", error);
    return Response.json({ error: "Failed to fetch idea" }, { status: 500 });
  }
}

// Update individual idea
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    const allowedFields = [
      "title",
      "content",
      "summary",
      "category",
      "tags",
      "completed",
      "priority",
      "topics",
    ];

    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(body[key]);
      }
    });

    if (updateFields.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Add updated_at timestamp
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    // Add the ID for WHERE clause
    paramCount++;
    values.push(id);

    const query = `
      UPDATE ideas 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const [updatedIdea] = await sql(query, values);

    if (!updatedIdea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    return Response.json(updatedIdea);
  } catch (error) {
    console.error("Error updating idea:", error);
    return Response.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

// Delete individual idea
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const [deletedIdea] = await sql`
      DELETE FROM ideas WHERE id = ${id} RETURNING *
    `;

    if (!deletedIdea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    return Response.json({ message: "Idea deleted successfully" });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return Response.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
