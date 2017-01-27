/**
 * Created by Emlyn Hughes on 5/01/17.
 */
import {
	StreamAdapter,
	Observer,
	StreamSubscribe,
	Subject as CycleSubject,
} from '@cycle/base';
import {stream as KefirStream} from 'kefir';

const KefirAdapter = {

	adapt(originStream, originStreamSubscribe) {
		if (KefirAdapter.isValidStream(originStream)) {
			return originStream;
		}

		let dispose = null;

		return  KefirStream(emitter => {
			const observer = {
				next: (x) => {	emitter.emit(x); },
				error: (err) => { emitter.error(err); },
				complete: (x) => { emitter.end(x); }
			};
			dispose = originStreamSubscribe(originStream, observer);

			return () => {
				if (typeof dispose === 'function') {
					dispose();
				}
			}
		});

	},

	remember(stream) {
		return stream.toProperty();
	},

	makeSubject() {

		let streamEmmiter = null;

		const stream = KefirStream(emitter => {
			streamEmmiter = emitter;

			return () => {
				streamEmmiter = null;
			}
		});

		const observer = {
			next: (x) => {
				if(streamEmmiter) {
					streamEmmiter.emit(x);
				}
			},
			error: (err) => {
				if(streamEmmiter) {
					streamEmmiter.error(err);
				}
			},
			complete: (x) => {
				if( streamEmmiter ) {
					streamEmmiter.end(x);
				}
			}
		};

		return {observer, stream};
	},

	isValidStream(stream) {
		return (
		typeof stream.toESObservable === 'function' &&
		typeof stream.observe === 'function');
	},

	streamSubscribe(stream, observer) {
		const subscription = stream.observe(
			observer.next.bind(observer),
			observer.error.bind(observer),
			observer.complete.bind(observer)
		);
		return () => subscription.unsubscribe();
	}
};

export default KefirAdapter;