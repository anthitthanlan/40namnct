import { render } from "@react-email/render";
import InvitationEmail from "./src/emails/InvitationEmail";
import fs from "fs";

async function run() {
  const html = await render(InvitationEmail({
    name: "Nguyễn Văn A",
    amount: 5000000,
    invitationCode: "NCT123456",
    nienKhoa: "2010 - 2013",
    phone: "0901234567",
    appUrl: "http://localhost:3000",
    type: "Tập thể",
    shirts: {
      "S": 0,
      "M": 1,
      "L": 2,
      "XL": 3,
      "XXL": 4
    }
  }));
  fs.writeFileSync("../mail.html", html);
}
run();
