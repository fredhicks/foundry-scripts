let applyChanges = false;

function sayThis(m) {
	ChatMessage.create({
		// speaker: ChatMessage.getSpeaker(controlledToken),
		content: m,
		type: CONST.CHAT_MESSAGE_TYPES.OOC,
		// sound: CONFIG.sounds.dice
	});
}

function bladesRoll(n) {

        let zeromode = false;

	if ( n < 0 ) { n = 0; }
	if ( n == 0 ) { zeromode = true; n = 2; }

	let r = new Roll( `${n}d6`, {} );

	r.roll();
	r.toMessage();

	// Might be better as a DicePool with keep high/keep low intelligence, 
	// but I want to get my hands into this directly, and I think players 
	// will want to see all the dice happening.

	let p = (r.parts)[0].rolls;

	// console.log("Parts object:");
	// console.log(p);

	let i = 0;
	let crit = 0;
	let resNum = 1;
	let resType = "highest";
	let result = "";

	if ( zeromode ) {
		n = 0; // set it back to 0 at this point
		resNum = 6;
		resType = "lowest";
	}
	
	for ( i = 0; i < p.length; i++ ) {
		let die = p[i].roll;
		if ( zeromode ) {
			if ( die < resNum ) { resNum = die; }
		} else {
			if ( resNum == 6 && die == 6 ) { crit++; }
			if ( die > resNum ) { resNum = die; }
		}
	}

	// let plu = ''; if ( n > 1 ) { plu = 'c'; }
	// result = `With ${n} di${plu}e rolled, the ${resType} die is a ${resNum}. `;
	//
	result = `With <b>${n}d</b> rolled, the ${resType} die is a <b>${resNum}</b>. `;
	
	if ( crit > 0 ) {
		result += crit + " additional six";
		if ( crit > 1 ) { result += "es were "; }
		else { result += " was "; }
		result += "rolled.<p><b>Critical success!</b>";

	} else if ( resNum == 6 ) {
		result += "<p><b>Success!</b>";
	} else if ( resNum >= 4 ) {
		result += "<p><b>Partial success.</b>";
	} else {
		result += "<p><b>Failure.</b>";
	}

	sayThis(result);

	return result;

}

function ucFirst(s) {
	var str = new String(s);
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function createListOfNumbers(n, s) {

	var text = ``;
	var i = 0;

	if ( s == "" ) {
		s = 0;
	}

	for ( i  = 0; i <= n; i++ ) {
		text += `<option value="${i}"`;
		if ( i == s ) {
			text += ` selected`;
		}
		text += `>${i}d</option>`;
	}

	return text;

}

function createListOfDiceMods(rs, re, s) {

	var text = ``;
	var i = 0;

	if ( s == "" ) {
		s = 0;
	}

	for ( i  = rs; i <= re; i++ ) {
		var plus = "";
		if ( i >= 0 ) { plus = "+" };
		text += `<option value="${i}"`;
		if ( i == s ) {
			text += ` selected`;
		}
		
		text += `>${plus}${i}d</option>`;
	}

	return text;

}

function createListOfActions(a) {

	var x = "";
	var text = "";
	var s = "";

	for ( x in a ) {

		var capword = ucFirst(x);
		var skills = a[x].skills;

		text += `<optgroup label="${capword} Actions">`;
		text += `<option value="${x}">${capword} (Resist)</option>`;

		for ( s in skills ) {
			var capskill = ucFirst(s);
			text += `<option value="${s}">${capskill}</option>`;
		}

		text += `</optgroup>`;

	}

	return text;

}

function statValue(a,stat) {

	var val = 0;
	var x = "";
	var s = "";

	findstat: {
		for ( x in a ) {

			var skills = a[x].skills;

			if ( x == stat ) {
				var resist = 0;
				for ( s in skills ) {
					if ( skills[s][0] > 0 ) { resist++; }
				}
				console.log(stat+" found, resistance roll; calculating stat value as "+resist);
				val = resist;
				break findstat;
			} else {
				for ( s in skills ) {
					if ( s == stat ) {
						console.log(stat+" found in "+x+"; value is "+skills[s]);
						val = skills[s][0];
						break findstat;
					}
				}
			}

		}
	}

	return parseInt(val);

}

// ZOD

if (!actor) {

	new Dialog({
		title: `Simple Roll`,
		content: `
			<h2>Roll some dice!</h2>
			<p>If you want to pull the numbers from a character, select their Token first.</p>
			<form>
				<div class="form-group">
					<label>Number of Dice:</label>
					<select id="qty" name="qty">
						${createListOfNumbers(10,1)}
					</select>
				</div>
			</form>
		`,
		buttons: {
			yes: {
				icon: "<i class='fas fa-check'></i>",
				label: `Roll`,
				callback: () => (applyChanges = true),
			},
			no: {
				icon: "<i class='fas fa-times'></i>",
				label: `Cancel`,
			},
		},
		default: "yes",
		close: (html) => { 
			if (applyChanges) {
				let diceQty = html.find('[name="qty"]')[0].value;
				console.log("Roll "+diceQty);

				bladesRoll(diceQty);
			}
		},
	}).render(true);

} else {

	let att = actor.data.data.attributes;

	new Dialog({
		title: `Which action?`,
		content: `
			<h2>Which action?</h2>
			<p>Which action are you rolling for <b>${actor.data.name}</b>?</p>
			<form>
				<div class="form-group">
					<label>Action:</label>
					<select id="action" name="action">
						${createListOfActions(att)}
						<optgroup label="Arbitrary Number of Dice">
						${createListOfNumbers(10)}
						</optgroup>
					</select>
				</div>
				<div class="form-group">
					<label>Modifier:</label>
					<select id="mod" name="mod">
						${createListOfDiceMods(-3,+3,0)}
					</select>
				</div>
			</form>
		`,
		buttons: {
			yes: {
				icon: "<i class='fas fa-check'></i>",
				label: `Roll`,
				callback: () => (applyChanges = true),
			},
			no: {
				icon: "<i class='fas fa-times'></i>",
				label: `Close`,
			},
		},
		default: "yes",
		close: (html) => { 
			if ( !actor ) { applyChanges = false; } // Just in case, I think? 
			if ( applyChanges ) {
				let att = actor.data.data.attributes;
				let chosenAction = html.find('[name="action"]')[0].value;
				let modifier = parseInt(html.find('[name="mod"]')[0].value);
				let method = "";
				let plus = "";
				let qty = 0; 
				let rqty = 0;
				let parsed = parseInt(chosenAction);

				if ( modifier >= 0 ) { plus = "+"; }

				if ( isNaN(parsed) ) {
					qty = statValue(att,chosenAction);
					rqty = qty+modifier;
					method = ucFirst(chosenAction)+"("+qty+"d)";
				} else {
					rqty = parsed + modifier;
					method = parsed+"d";
				}

				if ( rqty < 0 ) { rqty = 0; } 

				if ( modifier != 0 ) {
					method += plus+modifier+"d = "+rqty+"d";
				}

				sayThis(`Rolling <b>${method}</b> for <b>${actor.data.name}</b>`);

				bladesRoll(rqty);

			}
		},
	}).render(true);

}
