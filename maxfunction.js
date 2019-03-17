const maxFunction = new Function({
    args: [
      new Argument({variableName: "array", order: 0}),
      new Argument({variableName: "size", order: 1})
    ],
    statements: [
      new Declaration({
        destination: new Operand({type: variable, value: max}),
        value: new Operand({type: immediate, value: 0})
      }),
      new ForLoop({
        declaration: new Declaration({
          destination: new Operand({type: "variable", value: "i"}),
          value: new Operand({type: "immediate", value: 0})
        }),
        condition: new BinaryExpression({
          operator: "<",
          operand1: new Operand({type: "variable", value: "i"}),
          operand2: new Operand({type: "variable", value: "size"})
        }),
        update: new Assignment({
          destination: new Operand({type: "variable", value: "i"}),
          binaryExpression: new BinaryExpression({
            operator: "+",
            operand1: new Operand({type: "variable", value: "i"}),
            operand2: new Operand({type: "immediate", value: "1"})
          })
        }),
        statements: [
          new If({
            condition: new BinaryExpression({
              operator: "<",
              operand1: new Operand({type: "variable", value: max}),
              operand2: new Operand({type: "immediate", value: 2})
              //operand2: new Operand({type: "variable", value://TODO ARRAY ACCESS })
            }),
            statements: [
              new Assignment({
                destination: new Operand({type: "variable", value: max}),
                //binaryExpression: new Operand({type: "variable", value: }) //TODO Array access
              })
            ]
          }),
        ]
      })
    ]
  });