var postcss = require('postcss');

var plugin = require('./lib').default;

function run(input, output, opts) {
	return postcss([plugin(opts)]).process(input)
		.then(result => {
			expect(result.css).toEqual(output);
			expect(result.warnings().length).toBe(0);
		});
}

it('turns subtle("seigaiha") into a local file reference', () => {
	return run(
		'a{ background: subtle("seigaiha"); }',
		'a{ background: url("/build/css/seigaiha.png"); }',
		{ localPath: '.', serverPath: '/build/css' }
	);
});

it('turns subtle("new_year_background") into a local file reference', () => {
	return run(
		'a{ background: subtle("new_year_background"); }',
		'a{ background: url("/build/css/new_year_background.png"); }',
		{ localPath: '.', serverPath: '/build/css' }
	);
});

it('turns subtle("new_year_background") into a local file reference (local ref)', () => {
	return run(
		'a{ background: subtle("new_year_background"); }',
		'a{ background: url("css/new_year_background.png"); }',
		{ localPath: '.', serverPath: 'css/' }
	);
});

it('turns subtle("new_year_background") into a local file reference (http ref)', () => {
	return run(
		'a{ background: subtle("new_year_background"); }',
		'a{ background: url("http://localhost/css/new_year_background.png"); }',
		{ localPath: '.', serverPath: 'http://localhost/css/' }
	);
});

it('turns subtle("new_year_background") into a local file reference  (.. ref)', () => {
	return run(
		'a{ background: subtle("new_year_background"); }',
		'a{ background: url("../css/new_year_background.png"); }',
		{ localPath: '.', serverPath: '../css' }
	);
});

it('turns subtle("new_year_background") into a local file reference  (https ref)', () => {
	return run(
		'a{ background: subtle("new_year_background"); }',
		'a{ background: url("https://test.blah/css/new_year_background.png"); }',
		{ localPath: '.', serverPath: 'https://test.blah/css' }
	);
});
it('turns subtle("new_year_background") into a local file reference  (// ref)', () => {
	return run(
		'a{ background: subtle("new_year_background"); }',
		'a{ background: url("//css/new_year_background.png"); }',
		{ localPath: '.', serverPath: '//css' }
	);
});
