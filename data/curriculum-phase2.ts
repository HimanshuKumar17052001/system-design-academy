import type { Module } from "@/types/curriculum";

export const phase2Modules: Module[] = [
  {
    id: "lld-oop",
    number: 8,
    category: "lld",
    title: "OOP Principles",
    subtitle: "Encapsulation, inheritance, polymorphism, abstraction, and composition.",
    difficulty: "Beginner",
    estimatedHours: 2,
    icon: "Box",
    prerequisites: ["boe-math"],
    lessons: [
      {
        id: "l8-encapsulation",
        title: "Encapsulation & Abstraction",
        content: [
          {
            type: "text",
            content: "Encapsulation is the bundling of data and the methods that operate on that data within a single unit (class), while restricting direct access to some of the object's components. Abstraction is the concept of hiding complex implementation details and showing only the essential features.",
          },
          {
            type: "callout",
            variant: "info",
            content: "Think of a car: you interact with the steering wheel, pedals, and gear stick (interface), not the engine, transmission, or fuel injection system (implementation).",
          },
          {
            type: "bullets",
            items: [
              "Encapsulation protects object integrity by preventing external code from directly modifying internal state.",
              "Access modifiers (public, private, protected) enforce encapsulation boundaries.",
              "Abstraction reduces complexity by exposing only relevant operations.",
              "Abstract classes and interfaces are the primary tools for abstraction in OOP.",
            ],
          },
        ],
      },
      {
        id: "l8-inheritance",
        title: "Inheritance & Polymorphism",
        content: [
          {
            type: "text",
            content: "Inheritance allows a class to inherit properties and methods from another class, promoting code reuse. Polymorphism allows objects of different classes to be treated as objects of a common superclass, enabling flexible and extensible designs.",
          },
          {
            type: "table",
            headers: ["Concept", "Purpose", "Example"],
            rows: [
              ["Inheritance", "Code reuse, IS-A relationship", "Car extends Vehicle"],
              ["Polymorphism", "Same interface, different behavior", "Vehicle.start() behaves differently for Car vs Motorcycle"],
              ["Method Overriding", "Subclass provides specific implementation", "Car.start() overrides Vehicle.start()"],
              ["Method Overloading", "Same name, different parameters", "calculateArea(int radius) vs calculateArea(int width, int height)"],
            ],
          },
          {
            type: "callout",
            variant: "warning",
            content: "Prefer composition over inheritance. Inheritance creates tight coupling between parent and child. Composition (HAS-A) is more flexible: a Car HAS-A Engine, rather than IS-A Engine.",
          },
        ],
      },
      {
        id: "l8-composition",
        title: "Composition vs Inheritance",
        content: [
          {
            type: "text",
            content: "Composition is the design principle where a class contains instances of other classes as fields, rather than inheriting from them. This provides greater flexibility because behavior can be changed at runtime by swapping components.",
          },
          {
            type: "bullets",
            items: [
              "Inheritance: compile-time binding, rigid hierarchy, fragile base class problem.",
              "Composition: runtime binding, flexible, promotes single responsibility.",
              "The 'favor composition over inheritance' principle is widely considered best practice.",
              "Strategy pattern is a classic example of composition: a Context HAS-A Strategy.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "When you find yourself using inheritance just to reuse code, ask: 'Is this truly an IS-A relationship?' If not, use composition.",
          },
        ],
      },
    ],
    lab: {
      id: "code-lab-oop",
      title: "OOP Code Lab",
      kind: "code-editor",
      objective: "Implement a Vehicle hierarchy using both inheritance and composition approaches.",
      starterCode: "class Vehicle {\n  // Base class\n}\n\nclass Car extends Vehicle {\n  // Inheritance approach\n}\n\n// Composition approach\nclass Engine {\n  // Component\n}",
      hint: "Start with a Vehicle base class. Then create Car using inheritance. Compare with a composition approach where Car HAS-A Engine.",
    },
    checkpoint: {
      prompt: "Explain why composition is preferred over inheritance for a Car that needs to change its Engine type at runtime.",
      answer: "With inheritance, the engine type is fixed at compile time (Car IS-A V8Engine). With composition, Car HAS-A Engine interface; you can inject ElectricEngine or V8Engine at runtime via the constructor or setter. This follows the Open/Closed Principle.",
      type: "text",
    },
  },
  {
    id: "lld-solid",
    number: 9,
    category: "lld",
    title: "SOLID Principles",
    subtitle: "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.",
    difficulty: "Beginner",
    estimatedHours: 3,
    icon: "Shield",
    prerequisites: ["lld-oop"],
    lessons: [
      {
        id: "l9-srp",
        title: "Single Responsibility Principle (SRP)",
        content: [
          {
            type: "text",
            content: "A class should have only one reason to change. If a class handles multiple responsibilities, changes in one area can inadvertently break another.",
          },
          {
            type: "callout",
            variant: "warning",
            content: "Violating SRP: A UserService that handles authentication, profile updates, and email notifications. If the email template changes, you risk breaking authentication logic.",
          },
          {
            type: "bullets",
            items: [
              "Refactor by extracting cohesive behaviors into separate classes.",
              "Each class should encapsulate one axis of change.",
              "Ask: 'What business rule would force this class to change?' If you list multiple unrelated reasons, split the class.",
            ],
          },
        ],
      },
      {
        id: "l9-ocp",
        title: "Open/Closed Principle (OCP)",
        content: [
          {
            type: "text",
            content: "Software entities should be open for extension but closed for modification. You should be able to add new behavior without changing existing, working code.",
          },
          {
            type: "table",
            headers: ["Violation", "Fix"],
            rows: [
              ["if/else chain checking types", "Strategy pattern with polymorphic behavior"],
              ["Modifying PaymentProcessor for each new payment type", "PaymentProcessor depends on PaymentStrategy interface"],
              ["Switch statements on enums", "Replace with polymorphic dispatch"],
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "The Template Method and Strategy patterns are the primary tools for achieving OCP.",
          },
        ],
      },
      {
        id: "l9-lsp",
        title: "Liskov Substitution Principle (LSP)",
        content: [
          {
            type: "text",
            content: "Subtypes must be substitutable for their base types without altering the correctness of the program. If B extends A, then B should be usable wherever A is expected.",
          },
          {
            type: "callout",
            variant: "warning",
            content: "Classic LSP violation: Square extends Rectangle. Setting width on a Square also changes height, which violates the Rectangle contract that width and height are independent.",
          },
          {
            type: "bullets",
            items: [
              "Preconditions cannot be strengthened in a subclass.",
              "Postconditions cannot be weakened in a subclass.",
              "Invariants of the superclass must be preserved.",
              "If a subclass cannot honor the superclass contract, they should not be in an inheritance relationship.",
            ],
          },
        ],
      },
      {
        id: "l9-isp",
        title: "Interface Segregation Principle (ISP)",
        content: [
          {
            type: "text",
            content: "Clients should not be forced to depend on methods they do not use. Large interfaces should be split into smaller, more specific ones.",
          },
          {
            type: "callout",
            variant: "info",
            content: "A fat interface like Machine with print(), scan(), fax() forces a SimplePrinter to implement scan() and fax() as no-ops or throw UnsupportedOperationException. Split into Printer, Scanner, Fax interfaces.",
          },
        ],
      },
      {
        id: "l9-dip",
        title: "Dependency Inversion Principle (DIP)",
        content: [
          {
            type: "text",
            content: "High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.",
          },
          {
            type: "bullets",
            items: [
              "Without DIP: Business logic directly instantiates MySQLConnection.",
              "With DIP: Business logic depends on Database interface; MySQLConnection implements Database.",
              "Dependency Injection is the mechanism; DIP is the principle.",
              "Inversion of Control (IoC) containers (Spring, Angular) automate DIP.",
            ],
          },
          {
            type: "callout",
            variant: "tip",
            content: "Every time you use 'new' inside business logic, ask: 'Can I inject this dependency through a constructor instead?'",
          },
        ],
      },
    ],
    lab: {
      id: "solid-validator-lab",
      title: "SOLID Validator",
      kind: "code-editor",
      objective: "Analyze code snippets and identify which SOLID principles they violate.",
      starterCode: "class ReportGenerator {\n  void generatePDF() { /* ... */ }\n  void generateExcel() { /* ... */ }\n  void sendEmail() { /* ... */ }\n  void saveToDatabase() { /* ... */ }\n}",
      hint: "This class has multiple reasons to change: report format changes, email logic changes, database schema changes. Which principle does this violate?",
    },
    checkpoint: {
      prompt: "A class named NotificationService has methods: sendEmail(), sendSMS(), sendPushNotification(), and logNotification(). Which SOLID principles does this violate, and how would you refactor?",
      answer: "SRP (4 unrelated responsibilities) and ISP (clients wanting only email are forced to depend on SMS and push methods). Refactor: Extract EmailService, SMSService, PushService. Introduce Notification interface. Logger is a cross-cutting concern best handled by AOP or decorator pattern.",
      type: "text",
    },
  },
  {
    id: "lld-creational",
    number: 10,
    category: "lld",
    title: "Creational Patterns",
    subtitle: "Singleton, Factory, Builder, Prototype — how objects are created.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Factory",
    prerequisites: ["lld-solid"],
    lessons: [
      {
        id: "l10-singleton",
        title: "Singleton Pattern",
        content: [
          {
            type: "text",
            content: "Ensures a class has only one instance and provides a global point of access to it. Useful for shared resources like database connection pools, caches, and configuration managers.",
          },
          {
            type: "callout",
            variant: "warning",
            content: "Singletons make unit testing difficult because they carry global state. They also hide dependencies. Modern preference: use Dependency Injection frameworks to manage single instances (scopes) instead.",
          },
          {
            type: "code",
            language: "java",
            code: "public class Singleton {\n  private static volatile Singleton instance;\n  private Singleton() {}\n  public static Singleton getInstance() {\n    if (instance == null) {\n      synchronized (Singleton.class) {\n        if (instance == null) {\n          instance = new Singleton();\n        }\n      }\n    }\n    return instance;\n  }\n}",
            runnable: false,
          },
        ],
      },
      {
        id: "l10-factory",
        title: "Factory & Abstract Factory",
        content: [
          {
            type: "text",
            content: "The Factory pattern delegates object creation to a factory class, decoupling client code from concrete classes. Abstract Factory creates families of related objects.",
          },
          {
            type: "table",
            headers: ["Pattern", "When to Use", "Example"],
            rows: [
              ["Simple Factory", "Single product type, conditional creation", "createPaymentProcessor('stripe')"],
              ["Factory Method", "Subclass decides which class to instantiate", "Dialog.createButton() → WindowsButton or MacButton"],
              ["Abstract Factory", "Families of related products", "GUIFactory creates Button + Checkbox + ScrollBar together"],
            ],
          },
        ],
      },
      {
        id: "l10-builder",
        title: "Builder Pattern",
        content: [
          {
            type: "text",
            content: "Separates the construction of a complex object from its representation, allowing the same construction process to create different representations. Ideal for objects with many optional parameters.",
          },
          {
            type: "code",
            language: "java",
            code: "Computer computer = new Computer.Builder()\n  .setCPU(\"Intel i9\")\n  .setRAM(32)\n  .setSSD(1024)\n  .setGPU(\"RTX 4090\")\n  .build();",
            runnable: false,
          },
          {
            type: "callout",
            variant: "tip",
            content: "Builder eliminates telescoping constructors (new Computer(cpu), new Computer(cpu, ram), new Computer(cpu, ram, ssd)...).",
          },
        ],
      },
    ],
    lab: {
      id: "pattern-matcher-creational",
      title: "Creational Pattern Matcher",
      kind: "pattern-matcher",
      objective: "Match real-world scenarios to the correct creational design pattern.",
      hint: "Focus on how objects are created: Singleton (one instance), Factory (delegate creation), Builder (step-by-step assembly).",
    },
    checkpoint: {
      prompt: "When would you choose Builder over Factory Method?",
      answer: "Use Builder when creating an object with many optional parameters and you want to avoid telescoping constructors. Use Factory Method when the exact type of object to create depends on subclasses or runtime conditions, and you want to decouple client code from concrete classes.",
      type: "text",
    },
  },
  {
    id: "lld-structural",
    number: 11,
    category: "lld",
    title: "Structural Patterns",
    subtitle: "Adapter, Bridge, Decorator, Facade, Proxy — how classes and objects are composed.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "Layers",
    prerequisites: ["lld-creational"],
    lessons: [
      {
        id: "l11-adapter",
        title: "Adapter & Bridge",
        content: [
          {
            type: "text",
            content: "The Adapter pattern allows incompatible interfaces to work together. It wraps an existing class with a new interface. The Bridge pattern separates an abstraction from its implementation so both can vary independently.",
          },
          {
            type: "table",
            headers: ["Pattern", "Purpose", "Analogy"],
            rows: [
              ["Adapter", "Make existing classes work with new interfaces", "Power plug adapter (UK to US)"],
              ["Bridge", "Decouple abstraction from implementation", "Remote control (abstraction) + TV (implementation)"],
            ],
          },
        ],
      },
      {
        id: "l11-decorator",
        title: "Decorator & Proxy",
        content: [
          {
            type: "text",
            content: "Decorator adds responsibilities to objects dynamically. Proxy provides a surrogate or placeholder for another object to control access to it.",
          },
          {
            type: "table",
            headers: ["Pattern", "Use Case", "Example"],
            rows: [
              ["Decorator", "Add behavior without subclassing", "Java I/O streams: FileInputStream → BufferedInputStream → DataInputStream"],
              ["Proxy (Protection)", "Access control", "Authentication check before allowing file access"],
              ["Proxy (Virtual)", "Lazy initialization", "Load high-res image only when clicked"],
              ["Proxy (Remote)", "Network transparency", "Local stub for remote EJB object"],
            ],
          },
        ],
      },
      {
        id: "l11-facade",
        title: "Facade Pattern",
        content: [
          {
            type: "text",
            content: "Provides a simplified, unified interface to a complex subsystem. The Facade does not encapsulate the subsystem; it just provides a simpler entry point.",
          },
          {
            type: "callout",
            variant: "tip",
            content: "A Facade is common in API design: the public API exposes simple methods, while internally delegating to dozens of microservices, databases, and caches.",
          },
        ],
      },
    ],
    lab: {
      id: "pattern-matcher-structural",
      title: "Structural Pattern Matcher",
      kind: "pattern-matcher",
      objective: "Match real-world scenarios to the correct structural design pattern.",
      hint: "Think about how classes and objects are composed: Adapter (incompatible interfaces), Decorator (add behavior dynamically), Facade (simplify a subsystem).",
    },
    checkpoint: {
      prompt: "You need to add caching, logging, and metrics to an existing PaymentService without modifying it. Which pattern do you use, and how?",
      answer: "Decorator pattern. Create a PaymentServiceDecorator (or CachingPaymentService, LoggingPaymentService) that wraps the original PaymentService, delegates to it, and adds the new behavior before/after the call. This follows OCP: extend without modifying.",
      type: "text",
    },
  },
  {
    id: "lld-behavioral",
    number: 12,
    category: "lld",
    title: "Behavioral Patterns",
    subtitle: "Observer, Strategy, Command, Iterator, State — how objects interact and distribute responsibility.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "GitPullRequest",
    prerequisites: ["lld-structural"],
    lessons: [
      {
        id: "l12-observer",
        title: "Observer Pattern",
        content: [
          {
            type: "text",
            content: "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically. This is the foundation of event-driven programming.",
          },
          {
            type: "callout",
            variant: "info",
            content: "Modern implementations: Java's PropertyChangeListener, React's useEffect (subscribe to state changes), RxJS Observables, Kafka consumers.",
          },
        ],
      },
      {
        id: "l12-strategy",
        title: "Strategy Pattern",
        content: [
          {
            type: "text",
            content: "Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from clients that use it.",
          },
          {
            type: "table",
            headers: ["Context", "Without Strategy", "With Strategy"],
            rows: [
              ["Payment processing", "if/else on payment type", "PaymentStrategy interface with CreditCardStrategy, PayPalStrategy"],
              ["Sorting", "Single sort method", "SortStrategy with QuickSort, MergeSort, BubbleSort"],
              ["Compression", "Switch on format", "CompressionStrategy with ZipStrategy, RarStrategy"],
            ],
          },
        ],
      },
      {
        id: "l12-command",
        title: "Command & State",
        content: [
          {
            type: "text",
            content: "Command encapsulates a request as an object, allowing parameterization of clients with queues, requests, and operations. State allows an object to alter its behavior when its internal state changes.",
          },
          {
            type: "bullets",
            items: [
              "Command enables undo/redo, macro recording, and job queues.",
              "State eliminates large conditional statements by delegating behavior to state objects.",
              "Example: A TCPConnection object delegates to TCPClosed, TCPEstablished, TCPListening state objects.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "pattern-matcher-behavioral",
      title: "Behavioral Pattern Matcher",
      kind: "pattern-matcher",
      objective: "Match real-world scenarios to the correct behavioral design pattern.",
      hint: "Focus on how objects interact: Observer (notify subscribers), Strategy (interchangeable algorithms), Command (encapsulate requests).",
    },
    checkpoint: {
      prompt: "You are building an e-commerce checkout that supports Credit Card, PayPal, and Buy-Now-Pay-Later. How would you apply the Strategy pattern?",
      answer: "Define a PaymentStrategy interface with method processPayment(amount). Create CreditCardStrategy, PayPalStrategy, BNPLStrategy implementing this interface. The CheckoutService has a setPaymentStrategy(PaymentStrategy) method. At runtime, inject the appropriate strategy based on user selection. This follows OCP: add new payment methods without modifying CheckoutService.",
      type: "text",
    },
  },
  {
    id: "lld-uml",
    number: 13,
    category: "lld",
    title: "UML & Modeling",
    subtitle: "Class diagrams, sequence diagrams, component diagrams, and when to use each.",
    difficulty: "Intermediate",
    estimatedHours: 2,
    icon: "PenTool",
    prerequisites: ["lld-behavioral"],
    lessons: [
      {
        id: "l13-class-diagram",
        title: "Class Diagrams",
        content: [
          {
            type: "text",
            content: "Class diagrams show the static structure of a system: classes, their attributes, methods, and the relationships between them. They are the most common UML diagram in LLD interviews.",
          },
          {
            type: "table",
            headers: ["Relationship", "Notation", "Meaning"],
            rows: [
              ["Inheritance", "Solid line with hollow triangle", "IS-A relationship"],
              ["Association", "Solid line", "HAS-A relationship (A uses B)"],
              ["Aggregation", "Solid line with hollow diamond", "HAS-A, whole-part, but parts can exist independently"],
              ["Composition", "Solid line with filled diamond", "HAS-A, whole-part, parts cannot exist without whole"],
              ["Dependency", "Dashed line with arrow", "USES-A, temporary relationship"],
            ],
          },
        ],
      },
      {
        id: "l13-sequence",
        title: "Sequence Diagrams",
        content: [
          {
            type: "text",
            content: "Sequence diagrams show interactions between objects in a time-ordered sequence. They are essential for understanding the flow of a use case, identifying method signatures, and spotting missing objects.",
          },
          {
            type: "bullets",
            items: [
              "Lifelines: vertical dashed lines representing objects over time.",
              "Messages: horizontal arrows showing method calls (solid) or returns (dashed).",
              "Activation bars: rectangles on lifelines showing when an object is executing.",
              "Alt/Opt fragments: for if/else and optional paths.",
              "Loop fragment: for iterations.",
            ],
          },
        ],
      },
    ],
    lab: {
      id: "uml-sketchpad-lab",
      title: "UML Class Diagram Sketchpad",
      kind: "uml-sketchpad",
      objective: "Build a class diagram by dragging boxes, drawing relationships, and validating your model.",
      hint: "Place at least 2 classes. Use inheritance arrows (child → parent) and composition diamonds on the container side.",
    },
    checkpoint: {
      prompt: "Draw a UML class diagram for a Library Management System showing Book, Member, Librarian, and Loan. Include relationships and multiplicity.",
      answer: "Book (1) -- Loan (0..*): A Book can have multiple Loans over time. Member (1) -- Loan (0..*): A Member can have multiple active Loans. Librarian (1) -- Loan (0..*): A Librarian processes Loans. Book and Member are associated through Loan. Use composition for Library contains Books.",
      type: "diagram",
    },
  },
  {
    id: "lld-parking-lot",
    number: 14,
    category: "lld",
    title: "LLD Case: Parking Lot",
    subtitle: "Design a parking lot system from requirements to extensible classes.",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "Car",
    prerequisites: ["lld-uml"],
    lessons: [
      {
        id: "l14-requirements",
    title: "Requirements & Entities",
        content: [
          {
            type: "text",
            content: "Start every LLD case by listing functional and non-functional requirements. Then identify the core entities and their relationships.",
          },
          {
            type: "bullets",
            items: [
              "Functional: Park vehicle, remove vehicle, find available spot, calculate fee, support multiple vehicle types.",
              "Non-functional: Handle concurrent entries, extensible to new vehicle types, real-time spot availability.",
              "Entities: ParkingLot, Level, ParkingSpot, Vehicle (Car, Motorcycle, Truck), Ticket, Payment.",
            ],
          },
        ],
      },
      {
        id: "l14-design",
        title: "Class Design",
        content: [
          {
            type: "text",
            content: "Apply OOP and SOLID principles to design extensible classes. Use enums for spot types, strategy pattern for pricing.",
          },
          {
            type: "code",
            language: "java",
            code: "abstract class Vehicle {\n  String licensePlate;\n  VehicleType type;\n  // getters, equals, hashCode\n}\n\nenum VehicleType { CAR, MOTORCYCLE, TRUCK }\n\nclass ParkingSpot {\n  int spotId;\n  VehicleType type;\n  Vehicle parkedVehicle;\n  boolean isAvailable() { return parkedVehicle == null; }\n}\n\ninterface PricingStrategy {\n  double calculateFee(Ticket ticket);\n}",
            runnable: false,
          },
        ],
      },
    ],
    lab: {
      id: "code-lab-parking",
      title: "Parking Lot Code Lab",
      kind: "code-editor",
      objective: "Implement the core parking logic: park(), unpark(), and getAvailableSpots().",
      starterCode: "class ParkingLot {\n  List<Level> levels;\n  \n  boolean park(Vehicle vehicle) {\n    // Find first available spot matching vehicle type\n  }\n  \n  boolean unpark(Vehicle vehicle) {\n    // Remove vehicle and free spot\n  }\n  \n  int getAvailableSpots(VehicleType type) {\n    // Count available spots by type\n  }\n}",
      hint: "Iterate through levels, then spots. For park(), find the first spot where spot.type matches vehicle.type and spot.isAvailable(). Use synchronized or concurrent collections for thread safety.",
    },
    checkpoint: {
      prompt: "How would you extend the Parking Lot system to support electric vehicle charging spots without modifying existing classes?",
      answer: "Create a new ChargingSpot class extending ParkingSpot (or implementing a Spot interface). Add a ChargingPricingStrategy implementing PricingStrategy. Use OCP: extend, don't modify. The ParkingLot works with the Spot abstraction, so new spot types are plug-and-play.",
      type: "text",
    },
  },
  {
    id: "lld-elevator",
    number: 15,
    category: "lld",
    title: "LLD Case: Elevator System",
    subtitle: "State machines, scheduling algorithms, and concurrency in an elevator design.",
    difficulty: "Intermediate",
    estimatedHours: 3,
    icon: "ArrowUpDown",
    prerequisites: ["lld-parking-lot"],
    lessons: [
      {
        id: "l15-state-machine",
        title: "Elevator State Machine",
        content: [
          {
            type: "text",
            content: "An elevator is a classic state machine. It transitions between Idle, MovingUp, MovingDown, DoorOpen, and DoorClosed states based on events.",
          },
          {
            type: "table",
            headers: ["State", "Valid Transitions", "Trigger"],
            rows: [
              ["Idle", "MovingUp, MovingDown", "Request from above/below floor"],
              ["MovingUp", "Idle, DoorOpen", "Reached destination / no more up requests"],
              ["MovingDown", "Idle, DoorOpen", "Reached destination / no more down requests"],
              ["DoorOpen", "DoorClosed", "Timer expires"],
              ["DoorClosed", "Idle, MovingUp, MovingDown", "New request processed"],
            ],
          },
        ],
      },
      {
        id: "l15-scheduling",
        title: "Scheduling Algorithms",
        content: [
          {
            type: "text",
            content: "Elevator scheduling is an optimization problem. Common algorithms include FCFS, SCAN (elevator algorithm), and LOOK.",
          },
          {
            type: "bullets",
            items: [
              "FCFS: First-come-first-served. Simple but inefficient (zig-zag movement).",
              "SCAN: Moves in one direction until the last request, then reverses. Minimizes direction changes.",
              "LOOK: Like SCAN but reverses when there are no more requests in the current direction (not at the end).",
              "Modern elevators use predictive algorithms considering traffic patterns.",
            ],
          },
        ],
      },
    ],
    checkpoint: {
      prompt: "Design the class structure for an elevator system with multiple elevators. How do you handle concurrent requests?",
      answer: "Core classes: Building (has List<Elevator>), Elevator (has State, currentFloor, destinationQueue), ElevatorController (assigns requests to elevators using strategy), Request (floor, direction). Use a thread-safe PriorityQueue per elevator for requests. The controller uses a strategy (e.g., nearest elevator, least loaded) to assign. Synchronize on elevator state transitions.",
      type: "text",
    },
  },
];
