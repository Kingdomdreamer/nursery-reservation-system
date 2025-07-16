"use strict";exports.id=137,exports.ids=[137],exports.modules={3137:(e,s,t)=>{t.d(s,{Z:()=>o});var a=t(326),i=t(7577),l=t(5442),n=t(1058);class r{static{this.config={lineEnabled:!0,emailEnabled:!0,smsEnabled:!1,lineAccessToken:process.env.LINE_CHANNEL_ACCESS_TOKEN,emailConfig:{smtpHost:process.env.SMTP_HOST||"smtp.gmail.com",smtpPort:parseInt(process.env.SMTP_PORT||"587"),smtpUser:process.env.SMTP_USER||"",smtpPassword:process.env.SMTP_PASSWORD||"",fromEmail:process.env.FROM_EMAIL||"noreply@nursery.com",fromName:process.env.FROM_NAME||"園芸用品予約システム"}}}static async sendReservationConfirmation(e){try{let{data:s,error:t}=await l.OQ.from("reservations").select(`
          *,
          customer:customers(*),
          reservation_items(
            *,
            product:products(*)
          )
        `).eq("id",e).single();if(t||!s)throw Error("予約データが見つかりません");let a={customerId:s.customer_id,name:s.customer?.full_name||"顧客",phone:s.customer?.phone,email:s.customer?.email,lineUserId:s.customer?.line_user_id},i={subject:`【予約確定】${s.reservation_number}`,message:this.generateConfirmationMessage(s),templateData:{reservationNumber:s.reservation_number,customerName:a.name,reservationDate:s.reservation_date,pickupTime:`${s.pickup_time_start||""} - ${s.pickup_time_end||""}`.trim(),totalAmount:s.final_amount,items:s.reservation_items?.map(e=>({name:e.product?.name,quantity:e.quantity,price:e.unit_price}))||[]}},n=await this.sendMultiChannelNotification(a,i);return await this.logNotificationSent(e,"confirmation",n),{success:Object.values(n).some(e=>e.success),results:n}}catch(e){return console.error("予約確定通知の送信に失敗:",e),{success:!1,results:{}}}}static async sendPickupReminder(e){try{let{data:s,error:t}=await l.OQ.from("reservations").select(`
          *,
          customer:customers(*)
        `).eq("id",e).single();if(t||!s)throw Error("予約データが見つかりません");let a={customerId:s.customer_id,name:s.customer?.full_name||"顧客",phone:s.customer?.phone,email:s.customer?.email,lineUserId:s.customer?.line_user_id},i={subject:`【受取リマインダー】${s.reservation_number}`,message:this.generateReminderMessage(s),templateData:{reservationNumber:s.reservation_number,customerName:a.name,reservationDate:s.reservation_date,pickupTime:`${s.pickup_time_start||""} - ${s.pickup_time_end||""}`.trim()}},n=await this.sendMultiChannelNotification(a,i);return await l.OQ.from("reservations").update({reminder_sent_at:new Date().toISOString()}).eq("id",e),await this.logNotificationSent(e,"reminder",n),{success:Object.values(n).some(e=>e.success),results:n}}catch(e){return console.error("リマインダー通知の送信に失敗:",e),{success:!1,results:{}}}}static async sendMultiChannelNotification(e,s){let t={};return this.config.lineEnabled&&e.lineUserId&&(t.line=await this.sendLineMessage(e.lineUserId,s)),this.config.emailEnabled&&e.email&&(t.email=await this.sendEmail(e.email,s)),this.config.smsEnabled&&e.phone&&(t.sms=await this.sendSMS(e.phone,s)),t}static async sendLineMessage(e,s){try{if(!this.config.lineAccessToken)return{success:!1,error:"LINE Access Token が設定されていません"};let t=await fetch("https://api.line.me/v2/bot/message/push",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.lineAccessToken}`},body:JSON.stringify({to:e,messages:[{type:"text",text:s.message}]})});if(!t.ok){let e=await t.text();return{success:!1,error:`LINE API Error: ${e}`}}return{success:!0}}catch(e){return{success:!1,error:e.message}}}static async sendEmail(e,s){try{return console.log("Email sent to:",e,"Subject:",s.subject),{success:!0}}catch(e){return{success:!1,error:e.message}}}static async sendSMS(e,s){try{return console.log("SMS sent to:",e,"Message:",s.message),{success:!0}}catch(e){return{success:!1,error:e.message}}}static async logNotificationSent(e,s,t){try{console.log("Notification log:",{reservationId:e,type:s,results:t,sentAt:new Date().toISOString()})}catch(e){console.error("通知ログの記録に失敗:",e)}}static generateConfirmationMessage(e){let s=e.reservation_items?.map(e=>`・${e.product?.name} \xd7 ${e.quantity}個`).join("\n")||"";return`【予約確定のお知らせ】

${e.customer?.full_name} 様

ご予約いただきありがとうございます。
以下の内容で予約が確定いたしました。

■予約番号: ${e.reservation_number}
■受取日: ${new Date(e.reservation_date).toLocaleDateString()}
■受取時間: ${e.pickup_time_start||""} - ${e.pickup_time_end||""}

■ご注文内容:
${s}

■合計金額: \xa5${e.final_amount.toLocaleString()}

受取日にお越しください。
ご不明な点がございましたらお気軽にお問い合わせください。

園芸用品予約システム`}static generateReminderMessage(e){return`【受取リマインダー】

${e.customer?.full_name} 様

明日は商品の受取日です。

■予約番号: ${e.reservation_number}
■受取日: ${new Date(e.reservation_date).toLocaleDateString()}
■受取時間: ${e.pickup_time_start||""} - ${e.pickup_time_end||""}

お忘れのないようお気をつけてお越しください。

園芸用品予約システム`}static updateConfig(e){this.config={...this.config,...e}}static getConfig(){return{...this.config}}}class c{static async generateReservationPDF(e){try{let{data:s,error:t}=await l.OQ.from("reservations").select(`
          *,
          customer:customers (
            full_name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            unit_price,
            subtotal,
            product:products (
              name,
              price
            )
          )
        `).eq("id",e).single();if(t||!s)throw Error("予約データの取得に失敗しました");let a={id:s.id,reservation_number:s.reservation_number,customer_name:s.customer?.full_name||"不明",customer_phone:s.customer?.phone||"",customer_email:s.customer?.email,reservation_date:s.reservation_date,pickup_time_start:s.pickup_time_start,pickup_time_end:s.pickup_time_end,status:s.status,items:s.reservation_items?.map(e=>({product_name:e.product?.name||"不明",quantity:e.quantity,unit_price:e.unit_price,subtotal:e.subtotal}))||[],total_amount:s.total_amount,discount_amount:s.discount_amount,final_amount:s.final_amount,notes:s.notes,admin_notes:s.admin_notes,created_at:s.created_at};return this.generateReservationPDFHTML(a)}catch(e){throw console.error("PDF生成エラー:",e),Error("PDF生成に失敗しました")}}static async generateDailyReportPDF(e){try{let{data:s,error:t}=await l.OQ.from("reservations").select(`
          *,
          customer:customers (
            full_name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            unit_price,
            subtotal,
            product:products (
              name,
              price
            )
          )
        `).eq("reservation_date",e).order("pickup_time_start",{ascending:!0});if(t)throw Error("予約データの取得に失敗しました");let a=s?.map(e=>({id:e.id,reservation_number:e.reservation_number,customer_name:e.customer?.full_name||"不明",customer_phone:e.customer?.phone||"",customer_email:e.customer?.email,reservation_date:e.reservation_date,pickup_time_start:e.pickup_time_start,pickup_time_end:e.pickup_time_end,status:e.status,items:e.reservation_items?.map(e=>({product_name:e.product?.name||"不明",quantity:e.quantity,unit_price:e.unit_price,subtotal:e.subtotal}))||[],total_amount:e.total_amount,discount_amount:e.discount_amount,final_amount:e.final_amount,notes:e.notes,admin_notes:e.admin_notes,created_at:e.created_at}))||[],i={by_status:a.reduce((e,s)=>(e[s.status]=(e[s.status]||0)+1,e),{}),by_time_slot:a.reduce((e,s)=>{let t=s.pickup_time_start?`${s.pickup_time_start}-${s.pickup_time_end}`:"時間未指定";return e[t]=(e[t]||0)+1,e},{})},n={date:e,total_reservations:a.length,total_amount:a.reduce((e,s)=>e+s.final_amount,0),reservations:a,summary:i};return this.generateDailyReportPDFHTML(n)}catch(e){throw console.error("日次レポートPDF生成エラー:",e),Error("日次レポートPDF生成に失敗しました")}}static generateReservationPDFHTML(e){let s={pending:"保留中",confirmed:"確定",ready:"準備完了",completed:"完了",cancelled:"キャンセル"}[e.status]||e.status,t=e.pickup_time_start&&e.pickup_time_end?`${e.pickup_time_start} - ${e.pickup_time_end}`:"時間未指定";return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>注文書 - ${e.reservation_number}</title>
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .info-section { margin-bottom: 20px; }
    .info-section h2 { font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-item { margin-bottom: 10px; }
    .info-item label { font-weight: bold; margin-right: 10px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .items-table th { background-color: #f5f5f5; font-weight: bold; }
    .items-table .number { text-align: right; }
    .total-section { margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total-row.final { font-weight: bold; font-size: 14px; border-top: 2px solid #333; padding-top: 10px; }
    .notes { margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>注文書</h1>
    <p>予約番号: ${e.reservation_number}</p>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h2>顧客情報</h2>
      <div class="info-item">
        <label>氏名:</label>
        <span>${e.customer_name}</span>
      </div>
      <div class="info-item">
        <label>電話番号:</label>
        <span>${e.customer_phone}</span>
      </div>
      ${e.customer_email?`
      <div class="info-item">
        <label>メールアドレス:</label>
        <span>${e.customer_email}</span>
      </div>
      `:""}
    </div>

    <div class="info-section">
      <h2>予約情報</h2>
      <div class="info-item">
        <label>受取日:</label>
        <span>${new Date(e.reservation_date).toLocaleDateString("ja-JP")}</span>
      </div>
      <div class="info-item">
        <label>受取時間:</label>
        <span>${t}</span>
      </div>
      <div class="info-item">
        <label>ステータス:</label>
        <span>${s}</span>
      </div>
      <div class="info-item">
        <label>予約日時:</label>
        <span>${new Date(e.created_at).toLocaleString("ja-JP")}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h2>注文内容</h2>
    <table class="items-table">
      <thead>
        <tr>
          <th>商品名</th>
          <th class="number">数量</th>
          <th class="number">単価</th>
          <th class="number">小計</th>
        </tr>
      </thead>
      <tbody>
        ${e.items.map(e=>`
        <tr>
          <td>${e.product_name}</td>
          <td class="number">${e.quantity}</td>
          <td class="number">\xa5${e.unit_price.toLocaleString()}</td>
          <td class="number">\xa5${e.subtotal.toLocaleString()}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span>小計:</span>
        <span>\xa5${e.total_amount.toLocaleString()}</span>
      </div>
      ${e.discount_amount>0?`
      <div class="total-row">
        <span>割引:</span>
        <span>-\xa5${e.discount_amount.toLocaleString()}</span>
      </div>
      `:""}
      <div class="total-row final">
        <span>合計:</span>
        <span>\xa5${e.final_amount.toLocaleString()}</span>
      </div>
    </div>
  </div>

  ${e.notes?`
  <div class="notes">
    <h3>お客様備考</h3>
    <p>${e.notes}</p>
  </div>
  `:""}

  ${e.admin_notes?`
  <div class="notes">
    <h3>管理メモ</h3>
    <p>${e.admin_notes}</p>
  </div>
  `:""}

  <div class="footer">
    <p>種苗店予約システム - 発行日: ${new Date().toLocaleString("ja-JP")}</p>
  </div>
</body>
</html>
    `}static generateDailyReportPDFHTML(e){return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>日次予約レポート - ${e.date}</title>
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .summary { margin-bottom: 30px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .summary-item { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
    .summary-item h3 { margin-top: 0; }
    .reservations-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .reservations-table th, .reservations-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
    .reservations-table th { background-color: #f5f5f5; font-weight: bold; }
    .reservations-table .number { text-align: right; }
    .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-confirmed { background-color: #d1fae5; color: #065f46; }
    .status-ready { background-color: #dbeafe; color: #1e40af; }
    .status-completed { background-color: #f3f4f6; color: #374151; }
    .status-cancelled { background-color: #fee2e2; color: #991b1b; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>日次予約レポート</h1>
    <p>対象日: ${new Date(e.date).toLocaleDateString("ja-JP")}</p>
  </div>

  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item">
        <h3>予約概要</h3>
        <p>総予約数: ${e.total_reservations}件</p>
        <p>総金額: \xa5${e.total_amount.toLocaleString()}</p>
      </div>
      <div class="summary-item">
        <h3>ステータス別</h3>
        ${Object.entries(e.summary.by_status).map(([e,s])=>`
        <p>${e}: ${s}件</p>
        `).join("")}
      </div>
    </div>
  </div>

  <table class="reservations-table">
    <thead>
      <tr>
        <th>予約番号</th>
        <th>顧客名</th>
        <th>電話番号</th>
        <th>受取時間</th>
        <th>ステータス</th>
        <th>商品数</th>
        <th class="number">金額</th>
        <th>備考</th>
      </tr>
    </thead>
    <tbody>
      ${e.reservations.map(e=>{let s=`status-${e.status}`,t={pending:"保留中",confirmed:"確定",ready:"準備完了",completed:"完了",cancelled:"キャンセル"}[e.status]||e.status,a=e.pickup_time_start&&e.pickup_time_end?`${e.pickup_time_start}-${e.pickup_time_end}`:"未指定";return`
        <tr>
          <td>${e.reservation_number}</td>
          <td>${e.customer_name}</td>
          <td>${e.customer_phone}</td>
          <td>${a}</td>
          <td><span class="status-badge ${s}">${t}</span></td>
          <td>${e.items.length}</td>
          <td class="number">\xa5${e.final_amount.toLocaleString()}</td>
          <td>${e.notes||e.admin_notes||""}</td>
        </tr>
        `}).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>種苗店予約システム - 発行日: ${new Date().toLocaleString("ja-JP")}</p>
  </div>
</body>
</html>
    `}static printHTML(e){let s=window.open("","_blank");s&&(s.document.write(e),s.document.close(),s.focus(),s.print())}}function o(){let{showSuccess:e,showError:s}=(0,n.p)(),[t,o]=(0,i.useState)([]),[d,m]=(0,i.useState)(!0),[u,p]=(0,i.useState)("all"),[h,x]=(0,i.useState)(""),[b,v]=(0,i.useState)(""),[f,g]=(0,i.useState)(null),[j,_]=(0,i.useState)(!1),N=async(a,i)=>{try{let{error:s}=await l.OQ.from("reservations").update({status:i,..."confirmed"===i&&{confirmation_sent_at:new Date().toISOString()}}).eq("id",a);if(s)throw s;o(t.map(e=>e.id===a?{...e,status:i}:e)),"confirmed"===i&&await y(a),e("ステータスを更新しました","予約ステータスが正常に更新されました。")}catch(e){console.error("ステータスの更新に失敗しました:",e),s("ステータス更新に失敗しました",e?.message||"ステータスの更新中にエラーが発生しました。")}},y=async t=>{try{e("通知送信中...","予約確定通知を送信しています");let a=await r.sendReservationConfirmation(t);if(a.success){let s="予約確定通知を送信しました",t=[];a.results.line?.success&&t.push("LINE"),a.results.email?.success&&t.push("メール"),a.results.sms?.success&&t.push("SMS"),t.length>0&&(s+=` (${t.join("、")})`),e("通知送信完了",s)}else{let e=[];a.results.line?.error&&e.push(`LINE: ${a.results.line.error}`),a.results.email?.error&&e.push(`メール: ${a.results.email.error}`),a.results.sms?.error&&e.push(`SMS: ${a.results.sms.error}`),s("通知送信に失敗しました",e.join("\n")||"通知の送信中にエラーが発生しました")}}catch(e){console.error("通知送信エラー:",e),s("通知送信エラー",e.message||"通知の送信中にエラーが発生しました")}},w=async t=>{try{e("リマインダー送信中...","受取リマインダーを送信しています");let a=await r.sendPickupReminder(t);if(a.success){let s="受取リマインダーを送信しました",t=[];a.results.line?.success&&t.push("LINE"),a.results.email?.success&&t.push("メール"),a.results.sms?.success&&t.push("SMS"),t.length>0&&(s+=` (${t.join("、")})`),e("リマインダー送信完了",s)}else{let e=[];a.results.line?.error&&e.push(`LINE: ${a.results.line.error}`),a.results.email?.error&&e.push(`メール: ${a.results.email.error}`),a.results.sms?.error&&e.push(`SMS: ${a.results.sms.error}`),s("リマインダー送信に失敗しました",e.join("\n")||"リマインダーの送信中にエラーが発生しました")}}catch(e){console.error("リマインダー送信エラー:",e),s("リマインダー送信エラー",e.message||"リマインダーの送信中にエラーが発生しました")}},k=async t=>{try{e("PDF生成中...","注文書PDFを生成しています");let s=await c.generateReservationPDF(t);c.printHTML(s),e("PDF生成完了","注文書PDFを生成しました")}catch(e){console.error("PDF生成エラー:",e),s("PDF生成エラー",e.message||"PDFの生成中にエラーが発生しました")}},$=async()=>{try{let s=new Date().toISOString().split("T")[0];e("PDF生成中...",`${s}の予約レポートを生成しています`);let t=await c.generateDailyReportPDF(s);c.printHTML(t),e("PDF生成完了","当日の予約レポートを生成しました")}catch(e){console.error("PDF生成エラー:",e),s("PDF生成エラー",e.message||"PDFの生成中にエラーが発生しました")}},S=e=>{let s={pending:{label:"保留中",className:"bg-warning-subtle text-warning"},confirmed:{label:"確定",className:"bg-success-subtle text-success"},ready:{label:"準備完了",className:"bg-info-subtle text-info"},completed:{label:"完了",className:"bg-secondary-subtle text-secondary"},cancelled:{label:"キャンセル",className:"bg-danger-subtle text-danger"}},t=s[e]||s.pending;return a.jsx("span",{className:`badge ${t.className}`,children:t.label})},D=t.filter(e=>{let s="all"===u||e.status===u,t=!h||e.reservation_date===h,a=!b||e.reservation_number.toLowerCase().includes(b.toLowerCase())||e.customer?.full_name.toLowerCase().includes(b.toLowerCase())||e.customer?.phone.includes(b);return s&&t&&a}),L=e=>{g(e),_(!0)};return d?a.jsx("div",{className:"d-flex justify-content-center align-items-center",style:{height:"256px"},children:a.jsx("div",{className:"loading-spinner"})}):(0,a.jsxs)("div",{className:"container-fluid py-4",children:[a.jsx("div",{className:"row mb-4",children:a.jsx("div",{className:"col-12",children:(0,a.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[a.jsx("h2",{className:"h2 fw-bold text-dark",children:"予約一覧"}),(0,a.jsxs)("div",{className:"d-flex gap-3",children:[(0,a.jsxs)("button",{className:"btn btn-success",children:[a.jsx("i",{className:"bi bi-file-earmark-plus me-2"}),"新規予約追加"]}),(0,a.jsxs)("button",{onClick:$,className:"btn btn-outline-primary",children:[a.jsx("i",{className:"bi bi-file-earmark-bar-graph me-2"}),"当日レポートPDF"]})]})]})})}),a.jsx("div",{className:"row mb-4",children:a.jsx("div",{className:"col-12",children:a.jsx("div",{className:"card",children:a.jsx("div",{className:"card-body",children:(0,a.jsxs)("div",{className:"row g-3",children:[(0,a.jsxs)("div",{className:"col-lg-3 col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"ステータス"}),(0,a.jsxs)("select",{value:u,onChange:e=>p(e.target.value),className:"form-select",children:[a.jsx("option",{value:"all",children:"すべてのステータス"}),a.jsx("option",{value:"pending",children:"保留中"}),a.jsx("option",{value:"confirmed",children:"確定"}),a.jsx("option",{value:"ready",children:"準備完了"}),a.jsx("option",{value:"completed",children:"完了"}),a.jsx("option",{value:"cancelled",children:"キャンセル"})]})]}),(0,a.jsxs)("div",{className:"col-lg-3 col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"受取日"}),a.jsx("input",{type:"date",value:h,onChange:e=>x(e.target.value),className:"form-control"})]}),(0,a.jsxs)("div",{className:"col-lg-4 col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"検索"}),a.jsx("input",{type:"text",value:b,onChange:e=>v(e.target.value),placeholder:"予約番号、顧客名、電話番号で検索",className:"form-control"})]}),a.jsx("div",{className:"col-lg-2 col-md-6 d-flex align-items-end",children:(0,a.jsxs)("div",{className:"text-muted small",children:[D.length," 件の予約"]})})]})})})})}),a.jsx("div",{className:"row",children:a.jsx("div",{className:"col-12",children:(0,a.jsxs)("div",{className:"card",children:[a.jsx("div",{className:"d-none d-lg-block",children:a.jsx("div",{className:"table-responsive",children:(0,a.jsxs)("table",{className:"table table-hover",children:[a.jsx("thead",{className:"table-light",children:(0,a.jsxs)("tr",{children:[a.jsx("th",{className:"fw-medium text-muted text-uppercase small",children:"予約情報"}),a.jsx("th",{className:"fw-medium text-muted text-uppercase small",children:"顧客情報"}),a.jsx("th",{className:"fw-medium text-muted text-uppercase small",children:"受取日時"}),a.jsx("th",{className:"fw-medium text-muted text-uppercase small",children:"金額"}),a.jsx("th",{className:"fw-medium text-muted text-uppercase small",children:"ステータス"}),a.jsx("th",{className:"fw-medium text-muted text-uppercase small",children:"アクション"})]})}),a.jsx("tbody",{children:D.map(e=>(0,a.jsxs)("tr",{children:[a.jsx("td",{className:"px-3 py-3",children:(0,a.jsxs)("div",{children:[a.jsx("div",{className:"fw-medium text-dark",children:e.reservation_number}),(0,a.jsxs)("div",{className:"small text-muted",children:["作成: ",new Date(e.created_at).toLocaleDateString()]}),e.notes&&(0,a.jsxs)("div",{className:"small text-muted mt-1",children:[a.jsx("i",{className:"bi bi-file-earmark-text me-1"}),e.notes]})]})}),a.jsx("td",{className:"px-3 py-3",children:(0,a.jsxs)("div",{children:[a.jsx("div",{className:"fw-medium text-dark",children:e.customer?.full_name}),(0,a.jsxs)("div",{className:"small text-muted",children:[a.jsx("i",{className:"bi bi-telephone me-1"}),e.customer?.phone]}),e.customer?.email&&(0,a.jsxs)("div",{className:"small text-muted",children:[a.jsx("i",{className:"bi bi-envelope me-1"}),e.customer.email]})]})}),(0,a.jsxs)("td",{className:"px-3 py-3",children:[a.jsx("div",{className:"text-dark",children:new Date(e.reservation_date).toLocaleDateString()}),e.pickup_time_start&&e.pickup_time_end&&(0,a.jsxs)("div",{className:"small text-muted",children:[e.pickup_time_start," - ",e.pickup_time_end]})]}),(0,a.jsxs)("td",{className:"px-3 py-3",children:[(0,a.jsxs)("div",{className:"fw-medium text-dark",children:["\xa5",e.final_amount.toLocaleString()]}),e.discount_amount>0&&(0,a.jsxs)("div",{className:"small text-success",children:["割引: -\xa5",e.discount_amount.toLocaleString()]})]}),a.jsx("td",{className:"px-3 py-3",children:(0,a.jsxs)("select",{value:e.status,onChange:s=>N(e.id,s.target.value),className:"form-select form-select-sm",children:[a.jsx("option",{value:"pending",children:"保留中"}),a.jsx("option",{value:"confirmed",children:"確定"}),a.jsx("option",{value:"ready",children:"準備完了"}),a.jsx("option",{value:"completed",children:"完了"}),a.jsx("option",{value:"cancelled",children:"キャンセル"})]})}),a.jsx("td",{className:"px-3 py-3",children:(0,a.jsxs)("div",{className:"d-flex gap-1",children:[(0,a.jsxs)("button",{onClick:()=>L(e),className:"btn btn-outline-primary btn-sm",children:[a.jsx("i",{className:"bi bi-eye me-1"}),"詳細"]}),a.jsx("button",{onClick:()=>k(e.id),className:"btn btn-outline-secondary btn-sm",title:"注文書PDFを生成",children:a.jsx("i",{className:"bi bi-file-earmark-pdf"})}),"confirmed"===e.status&&!e.reminder_sent_at&&a.jsx("button",{onClick:()=>w(e.id),className:"btn btn-outline-warning btn-sm",title:"受取リマインダーを送信",children:a.jsx("i",{className:"bi bi-bell"})}),a.jsx("button",{className:"btn btn-outline-primary btn-sm",children:a.jsx("i",{className:"bi bi-pencil"})})]})})]},e.id))})]})})}),a.jsx("div",{className:"d-lg-none",children:a.jsx("div",{className:"card-body p-0",children:D.map(e=>(0,a.jsxs)("div",{className:"border-bottom p-3",children:[(0,a.jsxs)("div",{className:"d-flex justify-content-between align-items-start mb-3",children:[(0,a.jsxs)("div",{children:[a.jsx("div",{className:"fw-medium text-dark",children:e.reservation_number}),a.jsx("div",{className:"text-muted",children:e.customer?.full_name})]}),a.jsx("div",{children:S(e.status)})]}),(0,a.jsxs)("div",{className:"row g-3 mb-3 small",children:[(0,a.jsxs)("div",{className:"col-6",children:[a.jsx("span",{className:"text-muted",children:"受取日:"}),a.jsx("div",{className:"fw-medium",children:new Date(e.reservation_date).toLocaleDateString()})]}),(0,a.jsxs)("div",{className:"col-6",children:[a.jsx("span",{className:"text-muted",children:"金額:"}),(0,a.jsxs)("div",{className:"fw-medium",children:["\xa5",e.final_amount.toLocaleString()]})]}),(0,a.jsxs)("div",{className:"col-6",children:[a.jsx("span",{className:"text-muted",children:"電話:"}),a.jsx("div",{children:e.customer?.phone})]}),(0,a.jsxs)("div",{className:"col-6",children:[a.jsx("span",{className:"text-muted",children:"作成:"}),a.jsx("div",{children:new Date(e.created_at).toLocaleDateString()})]})]}),(0,a.jsxs)("div",{className:"d-flex justify-content-between align-items-center",children:[a.jsx("div",{className:"flex-grow-1 me-3",children:(0,a.jsxs)("select",{value:e.status,onChange:s=>N(e.id,s.target.value),className:"form-select form-select-sm",children:[a.jsx("option",{value:"pending",children:"保留中"}),a.jsx("option",{value:"confirmed",children:"確定"}),a.jsx("option",{value:"ready",children:"準備完了"}),a.jsx("option",{value:"completed",children:"完了"}),a.jsx("option",{value:"cancelled",children:"キャンセル"})]})}),(0,a.jsxs)("div",{className:"d-flex gap-1",children:[a.jsx("button",{onClick:()=>L(e),className:"btn btn-outline-primary btn-sm",children:"詳細"}),a.jsx("button",{onClick:()=>k(e.id),className:"btn btn-outline-secondary btn-sm",title:"注文書PDFを生成",children:a.jsx("i",{className:"bi bi-file-earmark-pdf"})}),"confirmed"===e.status&&!e.reminder_sent_at&&a.jsx("button",{onClick:()=>w(e.id),className:"btn btn-outline-warning btn-sm",title:"受取リマインダーを送信",children:a.jsx("i",{className:"bi bi-bell"})}),a.jsx("button",{className:"btn btn-outline-primary btn-sm",children:a.jsx("i",{className:"bi bi-pencil"})})]})]}),e.notes&&(0,a.jsxs)("div",{className:"mt-2 small text-muted bg-light p-2 rounded",children:[a.jsx("i",{className:"bi bi-file-earmark-text me-1"}),e.notes]})]},e.id))})})]})})}),0===D.length&&a.jsx("div",{className:"row",children:a.jsx("div",{className:"col-12",children:(0,a.jsxs)("div",{className:"text-center py-5",children:[a.jsx("i",{className:"bi bi-calendar-x text-muted",style:{fontSize:"4rem"}}),a.jsx("h3",{className:"h5 fw-medium text-dark mt-3 mb-2",children:"予約が見つかりません"}),a.jsx("p",{className:"text-muted",children:"検索条件を変更するか、新しい予約を追加してください。"})]})})}),j&&f&&a.jsx("div",{className:"modal fade show d-block",tabIndex:-1,style:{backgroundColor:"rgba(0,0,0,0.5)"},children:a.jsx("div",{className:"modal-dialog modal-lg modal-dialog-scrollable",children:(0,a.jsxs)("div",{className:"modal-content",children:[(0,a.jsxs)("div",{className:"modal-header",children:[a.jsx("h5",{className:"modal-title",children:"予約詳細"}),a.jsx("button",{type:"button",className:"btn-close",onClick:()=>_(!1)})]}),a.jsx("div",{className:"modal-body",children:(0,a.jsxs)("div",{className:"row g-4",children:[a.jsx("div",{className:"col-12",children:(0,a.jsxs)("div",{className:"row g-3",children:[(0,a.jsxs)("div",{className:"col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"予約番号"}),a.jsx("div",{className:"text-dark",children:f.reservation_number})]}),(0,a.jsxs)("div",{className:"col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"ステータス"}),a.jsx("div",{children:S(f.status)})]}),(0,a.jsxs)("div",{className:"col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"受取日"}),a.jsx("div",{className:"text-dark",children:new Date(f.reservation_date).toLocaleDateString()})]})]})}),(0,a.jsxs)("div",{className:"col-12",children:[a.jsx("h6",{className:"fw-medium text-dark mb-3",children:"顧客情報"}),(0,a.jsxs)("div",{className:"row g-3",children:[(0,a.jsxs)("div",{className:"col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"氏名"}),a.jsx("div",{className:"text-dark",children:f.customer?.full_name})]}),(0,a.jsxs)("div",{className:"col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"電話番号"}),a.jsx("div",{className:"text-dark",children:f.customer?.phone})]}),f.customer?.email&&(0,a.jsxs)("div",{className:"col-md-6",children:[a.jsx("label",{className:"form-label fw-medium",children:"メールアドレス"}),a.jsx("div",{className:"text-dark",children:f.customer.email})]})]})]}),(0,a.jsxs)("div",{className:"col-12",children:[a.jsx("h6",{className:"fw-medium text-dark mb-3",children:"注文商品"}),a.jsx("div",{className:"table-responsive",children:(0,a.jsxs)("table",{className:"table table-borderless",children:[a.jsx("tbody",{children:f.reservation_items?.map((e,s)=>a.jsxs("tr",{className:"border-bottom",children:[a.jsxs("td",{className:"ps-0",children:[a.jsx("div",{className:"fw-medium",children:e.product?.name}),a.jsxs("div",{className:"small text-muted",children:["\xa5",e.unit_price.toLocaleString()," \xd7 ",e.quantity]})]}),a.jsx("td",{className:"text-end pe-0",children:a.jsxs("div",{className:"fw-medium",children:["\xa5",e.subtotal.toLocaleString()]})})]},s))}),a.jsx("tfoot",{children:(0,a.jsxs)("tr",{className:"border-top",children:[a.jsx("td",{className:"ps-0 fw-bold",children:"合計"}),(0,a.jsxs)("td",{className:"text-end pe-0 fw-bold",children:["\xa5",f.final_amount.toLocaleString()]})]})})]})})]}),(f.notes||f.admin_notes)&&(0,a.jsxs)("div",{className:"col-12",children:[a.jsx("h6",{className:"fw-medium text-dark mb-3",children:"備考・メモ"}),f.notes&&(0,a.jsxs)("div",{className:"mb-3",children:[a.jsx("label",{className:"form-label fw-medium",children:"お客様備考"}),a.jsx("div",{className:"bg-light p-3 rounded",children:f.notes})]}),f.admin_notes&&(0,a.jsxs)("div",{children:[a.jsx("label",{className:"form-label fw-medium",children:"管理メモ"}),a.jsx("div",{className:"bg-warning-subtle p-3 rounded",children:f.admin_notes})]})]})]})}),(0,a.jsxs)("div",{className:"modal-footer",children:[a.jsx("button",{type:"button",className:"btn btn-secondary",onClick:()=>_(!1),children:"閉じる"}),(0,a.jsxs)("button",{type:"button",className:"btn btn-outline-primary",onClick:()=>k(f.id),children:[a.jsx("i",{className:"bi bi-file-earmark-pdf me-2"}),"PDF生成"]}),(0,a.jsxs)("button",{type:"button",className:"btn btn-primary",children:[a.jsx("i",{className:"bi bi-pencil me-2"}),"編集"]})]})]})})})]})}}};