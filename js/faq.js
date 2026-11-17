$(function () {
  'use strict';

  var $items = $('.faq-item');
  if (!$items.length) { return; }

  $items.find('.faq-answer').hide();

  $items.find('.faq-question').on('click', function () {
    var $button = $(this);
    var $item = $button.closest('.faq-item');
    var $answer = $button.next('.faq-answer');
    var willOpen = $button.attr('aria-expanded') !== 'true';

    $button.attr('aria-expanded', String(willOpen));
    $button.find('.faq-icon').text(willOpen ? '\u2212' : '+');
    $item.toggleClass('open', willOpen);
    $answer.stop(true, true).slideToggle(300);
  });
});
