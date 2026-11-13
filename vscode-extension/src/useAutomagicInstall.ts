import * as vscode from 'vscode';

// this function is currently unused
const useAutomagicInstall = async (context: vscode.ExtensionContext) => {
	// give user option to automagically install GlassAI
	const isInstalled = context.globalState.get('isInstalled');
	if (!isInstalled) {
		vscode.window.showInformationMessage('✨ Setup GlassAI automagically?', 'Yes', 'No').then(async selection => {

			if (selection === 'Yes') {

				vscode.window.showInformationMessage('Installing...');

				try {
					// automagically install GlassAI into their project


					// search filesystem for next.config.js
					const doc = vscode.workspace.textDocuments.find(doc => doc.fileName.endsWith('next.config.js'));
					if (!doc) {
						throw new Error('Could not find next.config.js');
					}

					// add SWC plugin
					// !TODO add the correct instructions
					const configInstructions = `Add the `;

					const body = JSON.stringify({ globalPaths: [doc.fileName], globalPath: doc.fileName, instructions: configInstructions, startLine: 1, endLine: doc.lineCount, startCol: 0, endCol: 100000, });

					// !TODO handle error
					await fetch('http://localhost:3002', { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' } });

					// search filesystem for _app.tsx or the root layout.tsx

					// import GlassListener.tsx
					// add <GlassListener />


					context.globalState.update('isInstalled', true);
					vscode.window.showInformationMessage('Installed automagically! 🎉');

				} catch (e) {
					console.log('Error installing GlassAI automagically: ' + e);
					vscode.window.showErrorMessage(`Your project is *special* and we could not install GlassAI automagically 😭. Please follow the manual instructions on our website.`);
				}


			} else if (selection === 'No') {

				vscode.window.showInformationMessage(`Please install GlassAI following the instructions on our website. It takes just a minute ⏩!`);
			}
		});

	}

};



export default useAutomagicInstall;
