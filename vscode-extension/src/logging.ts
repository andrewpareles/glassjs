import { createClient } from '@supabase/supabase-js';
import { supabase_public_key, supabase_url } from './parameters';

import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

import posthog from 'posthog-js';

// initialize supabase and posthog

const supabase = createClient(supabase_url, supabase_public_key);
let glass_deviceid: string | undefined = undefined;


posthog.init('phc_ttUsa6AxwHDiFgUDQIFRdvctzbzXsB1Usvu7eD3FLmX', // track to "Glass Extension" project (not "Glass Website")
	{
		api_host: 'https://us.i.posthog.com',
		person_profiles: 'always',
		debug: false
	}
);



let telemetryIsDisabled = () => {
	const allow = vscode.workspace.getConfiguration('glass').get('telemetry')
	const disabled = (allow === false); // if undefined, not disabled
	return disabled
}
if (telemetryIsDisabled()) {
	posthog.opt_out_capturing();
}

vscode.workspace.onDidChangeConfiguration((e) => {
	if (e.affectsConfiguration('glass.telemetry')) {
		const disabled = telemetryIsDisabled()
		if (disabled) {
			posthog.opt_out_capturing();
		}
		else {
			posthog.opt_in_capturing();
		}
	}
})


// generate deviceid
// identify user
export const useLogging = (context: vscode.ExtensionContext) => {

	glass_deviceid = context.globalState.get<string>('glass_deviceid');
	if (!glass_deviceid) {
		// Generate a new unique device ID
		glass_deviceid = uuidv4();
		context.globalState.update('glass_deviceid', glass_deviceid);

		posthog.capture('Created DeviceId', { deviceid: glass_deviceid, });
	}

	posthog.identify(glass_deviceid);



};

// log submission
// push to supabase and posthog
export const logUserSubmission = async ({ instructions, prompt, result }: { instructions: string, prompt: string, result: string }) => {

	const { data, error } = await supabase
		.from('api_requests')
		.insert({
			type: 'submit',
			ip_address: '',
			deviceid: glass_deviceid,
			instructions,
			prompt,
			result,
		});

	posthog.capture('Submitted Request', {
		instructions,
		// prompt,
		result,
		deviceid: glass_deviceid,
	});


};


export const logErrorSubmittingRequest = async (msg: string) => {
	posthog.capture('Error Submitting Request', { message: msg });
}
