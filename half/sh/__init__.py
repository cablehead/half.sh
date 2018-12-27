import subprocess
import tempfile
import logging
import shutil
import os

import liab


log = logging.getLogger(__name__)


schema = {
    'node': {
        'typ': 'hash',
        'ticks': {
            'typ': 'stream',
        },
    },
}


def Store(path):
    return liab.Store(schema, path)


def node_insert(wx, command):
    return wx.node.insert({'run': command})


def node_run(store, node_id):
    node = None

    try:
        path = tempfile.mkdtemp()
        with store.wx() as wx:
            node = wx.node[node_id].value()
            with open(
                    os.open(
                        path+'/run', os.O_CREAT | os.O_WRONLY, 0o777),
                    'w') as fh:
                fh.write(node['run'])

            p = subprocess.Popen(
                    path+'/run',
                    shell=True,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    )
            p.stdin.close()

            tick_id = wx.node[node_id].ticks.append({'pid': p.pid})

        res = {}
        res['stdout'] = p.stdout.read().decode()
        res['stderr'] = p.stderr.read().decode()
        res['exitcode'] = p.wait()

        with store.wx() as wx:
            wx.node[node_id].ticks[tick_id].set(res)

        return tick_id

    except Exception:
        log.exception(
            'exception running %s: %s', node_id, node and node['run'])
        raise

    finally:
        shutil.rmtree(path)
