import { RequestInfo } from 'rwsdk/worker';
import { Layout } from '../components/layout';
import { Button } from '../components/th/button';

export function Home({ ctx }: RequestInfo) {
  return (
    <Layout>
      <h1>Hello World</h1>
      <Button>Click Me</Button>
    </Layout>
  );
}
