import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "URL tidak ditemukan" }, { status: 400 });
  }

  // Hanya izinkan URL dari domain R2 kita sendiri
  const allowed = ["https://desain.unesa.app"];
  const isAllowed = allowed.some((domain) => imageUrl.startsWith(domain));
  if (!isAllowed) {
    return NextResponse.json({ error: "Domain tidak diizinkan" }, { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil gambar dari server" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "attachment",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[download-proxy] error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengunduh gambar" },
      { status: 500 }
    );
  }
}
