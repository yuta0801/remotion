import {bundle} from '@jonny/motion-bundler';
import {getVideoConfig} from '@jonny/motion-core';
import {
	openBrowser,
	provideScreenshot,
	stitchVideos,
} from '@jonny/motion-renderer';
import cliProgress from 'cli-progress';
import fs from 'fs';
import os from 'os';
import path from 'path';
import xns from 'xns';

xns(async () => {
	process.stdout.write('📦 (1/3) Bundling video...\n');
	const args = process.argv;
	const file = args[2];
	const fullPath = path.join(process.cwd(), file);
	await import(fullPath);
	const config = getVideoConfig();
	const result = await bundle(fullPath);
	console.log({result});
	process.stdout.write('📼 (2/3) Rendering frames...\n');
	const browser = await openBrowser();
	const page = await browser.newPage();
	const {frames} = config;
	const outputDir = await fs.promises.mkdtemp(
		path.join(os.tmpdir(), 'react-motion-render')
	);
	const bar = new cliProgress.Bar(
		{clearOnComplete: true},
		cliProgress.Presets.shades_grey
	);
	bar.start(frames, 0);
	for (let frame = 0; frame < frames; frame++) {
		process.env.MOTION_FRAME = String(frame);
		await provideScreenshot(page, {
			output: path.join(outputDir, `element-${frame}.png`),
			site: 'file://' + result + '/index.html?frame=' + frame,
		});
		bar.update(frame);
	}
	bar.stop();
	await browser.close();
	process.stdout.write('🧵 (3/3) Stitching frames together...\n');
	await stitchVideos({
		dir: outputDir,
		width: config.width,
		height: config.height,
		fps: config.fps,
	});
	console.log('\n▶️ Your video is ready - hit play!');
	console.log(path.join(outputDir, 'test.mp4'));
});