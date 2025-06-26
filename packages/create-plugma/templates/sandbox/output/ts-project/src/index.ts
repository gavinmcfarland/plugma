// My Awesome Project - A sample project generated with Combino

export function greet(name: string): string {
    return `Hello, ${name}!`;
}

if (require.main === module) {
    console.log(greet('World'));
}
