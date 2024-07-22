function findById(object, key, callback) {
	var property;

	for (property in object) {
		if (property === key) {
			object[key] = callback(object[key]);
		} else {
			if (typeof object[property] === 'object') {
				findById(object[property], key, callback);
			}
		}
		// if (object.hasOwnProperty(property) && typeof object[property] === 'object') {

		// }
	}
}

export function preprocess(type, callback) {
	return Object.assign({}, { preprocess: [type, callback] });
}

export function _process(data, callback) {
	// data = JSON.parse(data);
	// console.log('---cb', callback);
	if (callback.preprocess) {
		if (callback.preprocess[0] === 'content') {
			if (Array.isArray(data)) {
				data.map((item) => {
					// findById(item, 'content');
					if (item.content) {
						findById(item, 'content', callback.preprocess[1]);
					}
				});
			} else {
				findById(data, 'content', callback.preprocess[1]);
			}
		}

		if (callback.preprocess[0] === 'item') {
			if (Array.isArray(data)) {
				data.map((item) => {
					return callback.preprocess[1](item);
				});
			} else {
				data = callback.preprocess[1](data);
			}
		}

		if (callback.preprocess[0] === 'collection') {
			if (Array.isArray(data)) {
				data = callback.preprocess[1](data);
			}
		}

		return data;
	} else {
		return data;
	}
}
