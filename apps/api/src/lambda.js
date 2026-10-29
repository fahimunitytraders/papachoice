import { createHandler } from './handler.js';
import { awsDependencies } from './aws.js';
let application;
export async function handler(event) {
  application ||= createHandler(awsDependencies());
  return application(event);
}
