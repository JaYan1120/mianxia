(() => {
  'use strict';

  // 在这里填入 Web3Forms Access Key；也可以在页面加载前设置
  // window.MIANXIA_WEB3FORMS_KEY = '你的 Access Key'
  const WEB3FORMS_ACCESS_KEY = '9d5ce0e2-2b16-4970-8a67-2e9c50d661f4';
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

  const resolveKey = () => {
    const configured = window.MIANXIA_WEB3FORMS_KEY || WEB3FORMS_ACCESS_KEY;
    return String(configured || '').trim();
  };

  const setStatus = (form, message, state = '') => {
    const node = form.querySelector('[data-contact-status]');
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state;
    node.hidden = !message;
  };

  const setBusy = (form, busy) => {
    const button = form.querySelector('[type="submit"]');
    if (!button) return;
    if (busy) {
      button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="button-spinner"></span> 正在发送…';
    } else {
      button.disabled = false;
      if (button.dataset.label) button.innerHTML = button.dataset.label;
      delete button.dataset.label;
    }
  };

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-contact-form]');
    if (!form) return;
    event.preventDefault();
    if (form.dataset.busy === '1') return;

    const honeypot = form.querySelector('[name="botcheck"]');
    if (honeypot && String(honeypot.value || '').trim()) {
      form.reset();
      setStatus(form, '已收到，谢谢你的来信。', 'success');
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const accessKey = resolveKey();
    if (!accessKey || /^YOUR_|^REPLACE_/i.test(accessKey)) {
      setStatus(form, '联系表单尚未配置 Web3Forms Access Key，请稍后再试，或直接发邮件给我。', 'error');
      return;
    }

    form.dataset.busy = '1';
    setStatus(form, '', '');
    setBusy(form, true);

    const formData = new FormData(form);
    formData.append('access_key', accessKey);
    // 邮箱是选填的：不填就不发 email 字段，避免通知邮件里出现空的 Reply-To
    const email = String(formData.get('email') || '').trim();
    if (!email) {
      formData.delete('email');
      formData.append('reply_ok', '不需要回信');
    } else {
      formData.append('reply_ok', '可以回信');
    }
    if (formData.get('public_ok')) {
      formData.set('public_ok', '希望公开到留言簿');
    } else {
      formData.delete('public_ok');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData,
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || '发送没有成功');
      }
      form.reset();
      setStatus(form, '邮件已经送到，谢谢你愿意写下这些话。', 'success');
    } catch (error) {
      const message = error.name === 'AbortError'
        ? '发送超时了，请检查网络后再试一次。'
        : '发送失败了，请稍后再试，或直接通过邮箱联系我。';
      setStatus(form, message, 'error');
    } finally {
      clearTimeout(timeout);
      form.dataset.busy = '';
      setBusy(form, false);
    }
  });
})();
