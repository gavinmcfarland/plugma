export default function range(min, max) {
	var len = max - min;
	var arr = new Array(len);
	for (var i = 0; i < len; i++) {
		arr[i] = min + i;
	}
	return arr;
}
