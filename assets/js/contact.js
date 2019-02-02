import $ from './helpers/jq-helpers';
import Validator from 'form-validator-simple';

(function() {
  if ($('.g-recaptcha')) {
    checkReCaptcha();
  }
})();

const validatorConfig = {
  errorTemplate: '<span class="help-block form-error">%s</span>',
  onFormValidate: (isFormValid, form) => {
    form.querySelector('button').disabled = !isFormValid
  },
  onError: function(e, form) {
    $(`form[id=${form.getAttribute('id')}] .generic-error`).removeClass('d-none');
  },
  onSuccess: function(e, form) {
    if (form.dataset.hasNetlify) {
      return;
    }

    e.preventDefault()
    const id = form.getAttribute('id')
    const $form = $(`form[id=${id}]`)
    const action = $form.attr('action')
    const genericSuccess = $form.$('.generic-success')
    const genericError = $form.$('.generic-error')
    genericSuccess.addClass('hidden')
    genericError.addClass('d-none')
    $form.removeClass('error').removeClass('success')

    const serializedForm = $(`#${id}`).serialize()
    if (typeof grecaptcha !== "undefined" && grecaptcha.getResponse() === "") {
      grecaptcha.execute()
      return false
    }

    $form.$('button[type=submit]').attr('disabled', true).addClass('disabled')
    $.post(action, serializedForm, {
      contentType: 'application/x-www-form-urlencoded',
    })
      .then(() => {
        genericSuccess.removeClass('hidden')
        $form.addClass('success')
        $form.$('button[type=submit]').removeAttr('disabled').removeClass('disabled')
      })
      .catch(() => {
        genericError.removeClass('d-none')
        $form.addClass('error')
        $form.$('button[type=submit]').removeAttr('disabled').removeClass('disabled')
      });

    return false;
  }
};

document.querySelectorAll('form.contact')
  .forEach((form ) => {
    new Validator(Object.assign(validatorConfig, { form }))
    $(form).$('#generic-success [data-action="return-form"]').on('click', () => {
      $(form).$('#generic-success').addClass('hidden');
      $(form).removeClass('success');
    });
  })

function checkReCaptcha() {
  if (document.querySelector('.g-recaptcha-container') && typeof grecaptcha === "undefined") {
    $('.captcha-error').removeClass('d-none');
    setTimeout(checkReCaptcha, 200);
  } else {
    $('.captcha-error').addClass('d-none');
    $('.g-recaptcha-filler').addClass('d-none');
    $('.g-recaptcha').attr('disabled', true);
  }
}

window.onContactCaptcha = function($form) {
  document.querySelector('form.contact').dispatchEvent(new Event('submit'))
}

window.syna.stream.subscribe('contact:update', function({ name, email, phone, message }) {
  $('input[name=name]').attr('value', name || null)[0].focus();
  // TODO: REVISIT: Remove the following line whenever firefox fixes center on focus
  $('input[name=name]')[0].scrollIntoView({behavior: "instant", block: "center"});
  $('input[name=email]').attr('value', email || null);
  $('input[name=phone]').attr('value', phone || null);
  $('textarea[name=message]').$nodes.forEach(node => node.appendChild(document.createTextNode(message || '')));
});
