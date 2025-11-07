import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { z } from "zod";

import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

const Body = z.object({
  cardId: z.string().min(1),
  month: z
    .string()
    .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"),
  format: z.enum(["pdf", "csv"]).default("pdf"),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = Body.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join(", ") || "Invalid payload" }, { status: 400 });
  }

  const { cardId, month, format: outputFormat } = parsed.data;
  const [year, monthNumber] = month.split("-").map(Number);
  const periodStart = new Date(year, monthNumber - 1, 1);
  const periodEnd = new Date(year, monthNumber, 1);

  const card = await prisma.card.findFirst({
    where: { id: cardId, account: { userId: user.id } },
    include: { account: true },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      cardId: card.id,
      type: "CARD_SPEND",
      createdAt: {
        gte: periodStart,
        lt: periodEnd,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalSpend = transactions.reduce((acc, txn) => acc + Number(txn.amount), 0);
  const averageSpend = transactions.length > 0 ? totalSpend / transactions.length : 0;
  const limit = card.limit ? Number(card.limit) : undefined;

  if (outputFormat === "csv") {
    const csv = buildCsv({ card, month, transactions, totalSpend, averageSpend, limit });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="VaultX-card-${maskCard(card.cardNumber)}-${month}.csv"`,
      },
    });
  }

  const pdfBytes = await buildPdf({ card, month, transactions, totalSpend, averageSpend, limit });
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="VaultX-card-${maskCard(card.cardNumber)}-${month}.pdf"`,
    },
  });
}

function maskCard(cardNumber: string) {
  return cardNumber.replace(/\d(?=\d{4})/g, "•");
}

function buildCsv({
  card,
  month,
  transactions,
  totalSpend,
  averageSpend,
  limit,
}: {
  card: { cardNumber: string; expiry: string; account: { accountNumber: string } };
  month: string;
  transactions: { createdAt: Date; merchant: string | null; narrative: string | null; amount: any }[];
  totalSpend: number;
  averageSpend: number;
  limit?: number;
}) {
  const rows = [
    ["VaultX Card Statement"],
    ["Card", maskCard(card.cardNumber)],
    ["Linked Account", card.account.accountNumber],
    ["Period", month],
    [""],
    ["Merchant", "Narrative", "Date", "Amount"],
    ...transactions.map((txn) => [
      txn.merchant ?? "—",
      txn.narrative ?? "—",
      format(txn.createdAt, "yyyy-MM-dd HH:mm"),
      formatCurrency(Number(txn.amount)),
    ]),
    [""],
    ["Total Spend", formatCurrency(totalSpend)],
    ["Average Ticket", formatCurrency(averageSpend)],
    ["Monthly Limit", limit ? formatCurrency(limit) : "Unlimited"],
    ["Utilisation", limit ? `${((totalSpend / limit) * 100).toFixed(1)}%` : "—"],
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          if (value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    )
    .join("\r\n");
}

async function buildPdf({
  card,
  month,
  transactions,
  totalSpend,
  averageSpend,
  limit,
}: {
  card: { cardNumber: string; expiry: string; account: { accountNumber: string } };
  month: string;
  transactions: { createdAt: Date; merchant: string | null; narrative: string | null; amount: any }[];
  totalSpend: number;
  averageSpend: number;
  limit?: number;
}) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  let cursorY = height - 60;
  const leftMargin = 50;

  const writeLine = (text: string, options: { bold?: boolean; size?: number } = {}) => {
    const { bold = false, size = 12 } = options;
    const fontToUse = bold ? fontBold : font;
    page.drawText(text, {
      x: leftMargin,
      y: cursorY,
      size,
      font: fontToUse,
      color: undefined,
    });
    cursorY -= size + 6;
    if (cursorY < 60) {
      cursorY = height - 60;
      page = pdf.addPage();
    }
  };

  writeLine("VaultX Virtual Card Statement", { bold: true, size: 18 });
  writeLine(`Period: ${month}`, { size: 12 });
  writeLine(`Card: ${maskCard(card.cardNumber)}  |  Expiry: ${card.expiry}`, { size: 12 });
  writeLine(`Linked account: ${card.account.accountNumber}`, { size: 12 });
  cursorY -= 10;
  writeLine(`Total spend: ${formatCurrency(totalSpend)}`, { bold: true });
  writeLine(`Average ticket: ${formatCurrency(averageSpend)}`);
  writeLine(`Monthly limit: ${limit ? formatCurrency(limit) : "Unlimited"}`);
  if (limit) {
    writeLine(`Utilisation: ${((totalSpend / limit) * 100).toFixed(1)}%`);
  }

  cursorY -= 10;
  writeLine("Transactions", { bold: true, size: 16 });

  if (transactions.length === 0) {
    writeLine("No simulated spends during this period.");
  } else {
    transactions.forEach((txn) => {
      const header = `${format(txn.createdAt, "dd MMM yyyy HH:mm")}  •  ${txn.merchant ?? "Unknown merchant"}`;
      writeLine(header, { bold: true });
      writeLine(`Narrative: ${txn.narrative ?? "—"}`);
      writeLine(`Amount: ${formatCurrency(Number(txn.amount))}`);
      cursorY -= 4;
    });
  }

  return pdf.save();
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}


