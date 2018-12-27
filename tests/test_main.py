import half.sh


def test_core(tmp_path):
    store = half.sh.Store(str(tmp_path))
    with store.wx() as wx:
        _id = half.sh.node_insert(wx, 'echo Hello, world.')

    tick_id = half.sh.node_run(store, _id)

    with store.rx() as rx:
        assert rx.node[_id].ticks[tick_id].value() == {
            'stdout': 'Hello, world.\n', 'stderr': '', 'exitcode': 0}
