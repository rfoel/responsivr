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

Waves.attach('.btn .waves-effect', ['waves-button']);
Waves.init();