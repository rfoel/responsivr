$('.toggle').on('click', function () {
	var nav = '#'+$(this).data('activates');
	$(nav).toggleClass('visible');
	$(this).toggleClass('active');
});