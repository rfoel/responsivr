$('.toggle').on('click', function () {
	var nav = '#'+$(this).data('activates');
	$(nav).toggleClass('visible');
});

jQuery.each(jQuery('textarea[autoresize]'), function() {
	var offset = this.offsetHeight - this.clientHeight;

	var resizeTextarea = function(el) {
		jQuery(el).css('height', 'auto').css('height', el.scrollHeight + offset);
	};
	jQuery(this).on('keyup input', function() { resizeTextarea(this); }).removeAttr('autoresize');
});

$('.scrollspy').scrollSpy();

$('#select1').selecty();
$('#select2').selecty();
$('#select3').selecty();
$('#select4').selecty();