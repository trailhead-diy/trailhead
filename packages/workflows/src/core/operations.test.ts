import { describe, it, expect } from 'vitest';
import { createWorkflowOperations } from './operations.js';

describe('Workflow Operations', () => {
  const workflowOps = createWorkflowOperations();

  describe('createWorkflow', () => {
    it('should create a workflow with generated ID', () => {
      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [],
      });

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.description).toBe('A test workflow');
      expect(workflow.steps).toEqual([]);
    });
  });

  describe('createStep', () => {
    it('should create a step with generated ID', () => {
      const step = workflowOps.createStep({
        name: 'Test Step',
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      expect(step.id).toBeDefined();
      expect(step.name).toBe('Test Step');
      expect(typeof step.execute).toBe('function');
    });
  });

  describe('validateWorkflow', () => {
    it('should validate a correct workflow', () => {
      const step = workflowOps.createStep({
        name: 'Test Step',
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        steps: [step],
      });

      const result = workflowOps.validateWorkflow(workflow);
      expect(result.isOk()).toBe(true);
    });

    it('should reject workflow without name', () => {
      const workflow = workflowOps.createWorkflow({
        name: '',
        steps: [],
      });

      const result = workflowOps.validateWorkflow(workflow);
      expect(result.isErr()).toBe(true);
    });

    it('should reject workflow without steps', () => {
      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        steps: [],
      });

      const result = workflowOps.validateWorkflow(workflow);
      expect(result.isErr()).toBe(true);
    });

    it('should reject workflow with duplicate step IDs', () => {
      const step1 = workflowOps.createStep({
        name: 'Step 1',
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const step2 = { ...step1, name: 'Step 2' };

      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        steps: [step1, step2],
      });

      const result = workflowOps.validateWorkflow(workflow);
      expect(result.isErr()).toBe(true);
    });

    it('should reject workflow with invalid dependencies', () => {
      const step = workflowOps.createStep({
        name: 'Test Step',
        dependencies: ['non-existent-step'],
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        steps: [step],
      });

      const result = workflowOps.validateWorkflow(workflow);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('planExecution', () => {
    it('should create execution plan for simple workflow', () => {
      const step1 = workflowOps.createStep({
        name: 'Step 1',
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const step2 = workflowOps.createStep({
        name: 'Step 2',
        dependencies: [step1.id],
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        steps: [step1, step2],
      });

      const result = workflowOps.planExecution(workflow);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const plan = result.value;
        expect(plan.workflowId).toBe(workflow.id);
        expect(plan.steps).toHaveLength(2);
        expect(plan.parallel).toBe(true);
      }
    });

    it('should determine correct execution order', () => {
      const step1 = workflowOps.createStep({
        name: 'Step 1',
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const step2 = workflowOps.createStep({
        name: 'Step 2',
        dependencies: [step1.id],
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const step3 = workflowOps.createStep({
        name: 'Step 3',
        dependencies: [step2.id],
        execute: async () => ({ isOk: () => true, value: 'success' }) as any,
      });

      const workflow = workflowOps.createWorkflow({
        name: 'Test Workflow',
        steps: [step3, step1, step2], // Deliberately out of order
      });

      const result = workflowOps.planExecution(workflow);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const plan = result.value;
        const stepIds = plan.steps.map(s => s.stepId);

        // Should be in correct dependency order
        expect(stepIds.indexOf(step1.id)).toBeLessThan(stepIds.indexOf(step2.id));
        expect(stepIds.indexOf(step2.id)).toBeLessThan(stepIds.indexOf(step3.id));
      }
    });
  });
});
